import { NextRequest, NextResponse } from "next/server";
import {
  getServerSession,
  setSessionImpersonation,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  calculateEffectiveRoles,
} from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const sessionContext = await getServerSession(req);
    if (!sessionContext) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    // Security Gate: Only the actual logged-in user with admin role can impersonate!
    if (sessionContext.actualUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can initiate user impersonation" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

    const { session, token, effectiveUser } = await setSessionImpersonation(
      sessionContext.session.id,
      targetUserId
    );

    // Fetch effective user with group members for roles
    const userWithGroups = await db.user.findUnique({
      where: { id: effectiveUser.id },
      include: { groupMembers: { include: { group: true } } },
    });

    const groupRoles = userWithGroups?.groupMembers?.map(
      (gm: any) => gm.group?.roles
    );
    const roles = calculateEffectiveRoles(
      effectiveUser.role,
      effectiveUser.roles,
      groupRoles
    );

    const response = NextResponse.json({
      success: true,
      message: `Now impersonating ${effectiveUser.name}`,
      user: {
        id: effectiveUser.id,
        name: effectiveUser.name,
        email: effectiveUser.email,
        userName: effectiveUser.userName,
        role: effectiveUser.role,
        roles: effectiveUser.roles,
        department: effectiveUser.department,
        title: effectiveUser.title,
        avatar: effectiveUser.avatar,
      },
      actualUser: {
        id: sessionContext.actualUser.id,
        name: sessionContext.actualUser.name,
        email: sessionContext.actualUser.email,
        role: sessionContext.actualUser.role,
      },
      isImpersonating: true,
      effectiveRoles: roles,
      token,
    });

    // Update session cookie with new token reflecting impersonation
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Impersonate error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to impersonate user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionContext = await getServerSession(req);
    if (!sessionContext) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    const { token, effectiveUser } = await setSessionImpersonation(
      sessionContext.session.id,
      null
    );

    const userWithGroups = await db.user.findUnique({
      where: { id: effectiveUser.id },
      include: { groupMembers: { include: { group: true } } },
    });

    const groupRoles = userWithGroups?.groupMembers?.map(
      (gm: any) => gm.group?.roles
    );
    const roles = calculateEffectiveRoles(
      effectiveUser.role,
      effectiveUser.roles,
      groupRoles
    );

    const response = NextResponse.json({
      success: true,
      message: "Impersonation ended. Restored original administrator session.",
      user: {
        id: effectiveUser.id,
        name: effectiveUser.name,
        email: effectiveUser.email,
        userName: effectiveUser.userName,
        role: effectiveUser.role,
        roles: effectiveUser.roles,
        avatar: effectiveUser.avatar,
      },
      isImpersonating: false,
      effectiveRoles: roles,
      token,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("End impersonation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to end impersonation" },
      { status: 500 }
    );
  }
}

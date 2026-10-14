import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  comparePassword,
  hashPassword,
  createDbSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  calculateEffectiveRoles,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, personaId } = body;

    let user: any = null;

    // 1. Authenticate via personaId (1-click persona switch from UI)
    if (personaId) {
      user = await db.user.findFirst({
        where: {
          OR: [{ id: personaId }, { role: personaId }, { userName: personaId }],
        },
        include: {
          groupMembers: { include: { group: true } },
        },
      });
      if (!user) {
        return NextResponse.json(
          { error: `Persona '${personaId}' not found in database` },
          { status: 404 }
        );
      }
    } else {
      // 2. Authenticate via email or username + password
      const identifier = (email || username || "").trim().toLowerCase();
      if (!identifier) {
        return NextResponse.json(
          { error: "Email or username is required" },
          { status: 400 }
        );
      }

      user = await db.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier } },
            { userName: { equals: identifier } },
          ],
        },
        include: {
          groupMembers: { include: { group: true } },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Invalid username, email, or password" },
          { status: 401 }
        );
      }

      // Check if user is active
      if (!user.active) {
        return NextResponse.json(
          { error: "User account is inactive. Contact platform administrator." },
          { status: 403 }
        );
      }

      const inputPassword = password || "";

      if (user.passwordHash) {
        const matches = await comparePassword(inputPassword, user.passwordHash);
        if (!matches) {
          return NextResponse.json(
            { error: "Invalid username, email, or password" },
            { status: 401 }
          );
        }
      } else {
        // Fallback for unseeded / newly migrated accounts:
        // Accept default passwords 'admin123', 'ServiceMeow!2026', or username
        const validDefaults = ["admin123", "ServiceMeow!2026", user.role, user.userName];
        if (!inputPassword || !validDefaults.includes(inputPassword)) {
          return NextResponse.json(
            { error: "Invalid password for uninitialized account" },
            { status: 401 }
          );
        }
        // Save initial bcrypt hash
        const newHash = await hashPassword(inputPassword);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      }
    }

    // Create DB session
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      undefined;

    const { session, token } = await createDbSession(user.id, userAgent, ipAddress);

    // Compute effective roles from DB
    const groupRoles = user.groupMembers?.map((gm: any) => gm.group?.roles);
    const roles = calculateEffectiveRoles(user.role, user.roles, groupRoles);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userName: user.userName,
        role: user.role,
        roles: user.roles,
        department: user.department,
        title: user.title,
        avatar: user.avatar,
      },
      effectiveRoles: roles,
      token,
      sessionId: session.id,
    });

    // Set HTTP-Only Cookie
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
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to authenticate" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionContext = await getServerSession(req);

    if (!sessionContext) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        roles: ["public"],
        isImpersonating: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionContext.user.id,
        name: sessionContext.user.name,
        email: sessionContext.user.email,
        userName: sessionContext.user.userName,
        role: sessionContext.user.role,
        roles: sessionContext.user.roles,
        department: sessionContext.user.department,
        title: sessionContext.user.title,
        avatar: sessionContext.user.avatar,
      },
      actualUser: {
        id: sessionContext.actualUser.id,
        name: sessionContext.actualUser.name,
        email: sessionContext.actualUser.email,
        userName: sessionContext.actualUser.userName,
        role: sessionContext.actualUser.role,
        avatar: sessionContext.actualUser.avatar,
      },
      isImpersonating: sessionContext.isImpersonating,
      roles: sessionContext.roles,
      primaryRole: sessionContext.primaryRole,
      isAdmin: sessionContext.isAdmin,
      sessionId: sessionContext.session.id,
    });
  } catch (err: any) {
    console.error("Auth me error:", err);
    return NextResponse.json(
      { authenticated: false, error: "Failed to resolve session" },
      { status: 500 }
    );
  }
}

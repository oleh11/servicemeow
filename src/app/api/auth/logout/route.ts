import { NextRequest, NextResponse } from "next/server";
import { getServerSession, destroySession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionContext = await getServerSession(req);
    if (sessionContext) {
      await destroySession(sessionContext.session.id);
    }

    const response = NextResponse.json({ success: true, message: "Logged out" });

    // Clear Cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Logout route error:", err);
    return NextResponse.json({ success: true });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "./lib/auth-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Extract session token from cookie or Authorization header
  let token = req.cookies.get(SESSION_COOKIE_NAME)?.value || null;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 2. Verify token
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session;
  const role = session?.role || "public";
  const isImpersonating = !!session?.impersonatedUserId;
  const isAdmin = role === "admin" && !isImpersonating;

  // 3. Route Guard: /login
  if (pathname === "/login") {
    if (isAuthenticated) {
      // If already logged in, redirect to workspace or portal based on role
      const redirectUrl = role === "employee" ? "/portal" : "/workspace";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.next();
  }

  // 4. Route Guard: /studio (Admin Center - Strictly restricted to admin personas)
  if (pathname.startsWith("/studio")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      // Non-admin personas or admins impersonating non-admins are blocked!
      const accessDeniedUrl = new URL("/workspace", req.url);
      accessDeniedUrl.searchParams.set("error", "studio_admin_required");
      return NextResponse.redirect(accessDeniedUrl);
    }
  }

  // 5. Route Guard: /workspace (ITSM Agent Workspace)
  if (pathname.startsWith("/workspace")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Employees should use the self-service portal (/portal)
    if (role === "employee") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  // 6. Route Guard: Protected portal subpages (e.g. /portal/my-tickets)
  if (pathname.startsWith("/portal/my-tickets")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 7. Inject verified identity headers for downstream server components and API routes
  const requestHeaders = new Headers(req.headers);
  if (session) {
    requestHeaders.set("x-auth-user-id", session.userId);
    requestHeaders.set("x-auth-role", session.role);
    requestHeaders.set("x-session-id", session.sessionId);
    if (session.impersonatedUserId) {
      requestHeaders.set("x-impersonated-user-id", session.impersonatedUserId);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/studio/:path*",
    "/portal/my-tickets/:path*",
    "/login",
  ],
};

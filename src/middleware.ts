import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "./lib/auth-token";

// Endpoints that are explicitly public and do not require session authentication
const PUBLIC_API_ROUTES = [
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/now/service-status",
  "/api/portal/status",
];

// Configuration / Administrative API routes that strictly require admin role
const ADMIN_API_PREFIXES = [
  "/api/now/roles",
  "/api/now/groups",
  "/api/now/acls",
  "/api/now/business-rules",
  "/api/now/client-scripts",
  "/api/now/ui-policies",
  "/api/now/flows",
  "/api/now/scheduled-jobs",
  "/api/now/script-includes",
  "/api/now/scripted-apis",
  "/api/now/update-sets",
  "/api/now/import-sets",
  "/api/now/schema",
  "/api/now/navigation",
  "/api/now/variable-sets",
  "/api/now/schedules",
  "/api/now/events",
  "/api/now/notifications",
  "/api/now/contracts",
];

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

  // 2. Cryptographic token verification (pure Web Crypto API at the Edge)
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session;
  const role = session?.role || "public";
  const isImpersonating = !!session?.impersonatedUserId;
  const isAdmin = role === "admin" && !isImpersonating;

  // 3. API Route Guard (/api/*)
  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_ROUTES.some(
      (pub) => pathname === pub || pathname.startsWith(pub + "/")
    );

    if (!isPublicApi) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Authentication required to access this endpoint", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      // Check Administrative API routes
      const isAdminApi = ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
      if (isAdminApi && !isAdmin) {
        return NextResponse.json(
          { error: "Administrative privileges required to access this endpoint", code: "FORBIDDEN" },
          { status: 403 }
        );
      }

      // User management: only admins can create or list users
      if (pathname.startsWith("/api/now/users") && req.method === "POST" && !isAdmin) {
        return NextResponse.json(
          { error: "Only administrators can create users or alter roles", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
    }
  }

  // 4. Route Guard: /login
  if (pathname === "/login") {
    if (isAuthenticated) {
      const redirectUrl = role === "employee" ? "/portal" : "/workspace";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.next();
  }

  // 5. Route Guard: /studio (Admin Center - Strictly restricted to actual admins)
  if (pathname.startsWith("/studio")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      const accessDeniedUrl = new URL("/workspace", req.url);
      accessDeniedUrl.searchParams.set("error", "studio_admin_required");
      return NextResponse.redirect(accessDeniedUrl);
    }
  }

  // 6. Route Guard: /workspace (Agent Workspace - requires itil/admin/etc.)
  if (pathname.startsWith("/workspace")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (role === "employee") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  // 7. Route Guard: Protected portal subpages
  if (pathname.startsWith("/portal/my-tickets")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 8. Inject verified identity headers downstream
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
    "/api/:path*",
    "/workspace/:path*",
    "/studio/:path*",
    "/portal/my-tickets/:path*",
    "/login",
  ],
};

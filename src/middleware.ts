import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "./lib/auth";

// Runs on the Node.js runtime (stable since Next 15.5) so every request is
// checked against the session table and the user's *current* DB roles —
// not just the role claim baked into a signed token at login. Demoting a
// user or deleting their session takes effect on the next request.

// Endpoints that are explicitly public and do not require session authentication
const PUBLIC_API_ROUTES = [
  "/api/health",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/now/service-status",
  "/api/portal/status",
];

// Configuration / administrative API routes: admin required for every method
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

// Readable by any authenticated user (portal/catalog needs them), but only
// admins may create/modify/delete. Record producers carry server-side scripts.
const ADMIN_WRITE_PREFIXES = [
  "/api/now/producers",
  "/api/now/catalog/item",
  "/api/now/apps",
];

// Non-admin write exceptions inside ADMIN_WRITE_PREFIXES (exact path patterns)
const NON_ADMIN_WRITE_ALLOWED = [/^\/api\/now\/producers\/[^/]+\/submit\/?$/];

// Identity headers are only ever set by this middleware; strip client copies.
const IDENTITY_HEADERS = ["x-auth-user-id", "x-auth-role", "x-session-id", "x-impersonated-user-id"];

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

function forbidden(error: string) {
  return NextResponse.json({ error, code: "FORBIDDEN" }, { status: 403 });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Resolve the session from the DB (token signature + session row + current roles)
  const session = await getServerSession(req);
  const isAuthenticated = !!session;
  const role = session?.primaryRole || "public";
  const isImpersonating = !!session?.isImpersonating;
  const isAdmin = !!session?.isAdmin && !isImpersonating;

  // 2. API Route Guard (/api/*)
  if (pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_ROUTES.some((pub) => matchesPrefix(pathname, pub));

    if (!isPublicApi) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: "Authentication required to access this endpoint", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }

      if (!isAdmin) {
        if (ADMIN_API_PREFIXES.some((p) => matchesPrefix(pathname, p))) {
          return forbidden("Administrative privileges required to access this endpoint");
        }

        const isWrite = !SAFE_METHODS.has(req.method.toUpperCase());
        if (
          isWrite &&
          ADMIN_WRITE_PREFIXES.some((p) => matchesPrefix(pathname, p)) &&
          !NON_ADMIN_WRITE_ALLOWED.some((re) => re.test(pathname))
        ) {
          return forbidden("Administrative privileges required to modify this resource");
        }

        // User management: only admins can create users
        if (matchesPrefix(pathname, "/api/now/users") && req.method === "POST") {
          return forbidden("Only administrators can create users or alter roles");
        }
      }
    }
  }

  // 3. Route Guard: /login
  if (pathname === "/login") {
    if (isAuthenticated) {
      const redirectUrl = role === "employee" ? "/portal" : "/workspace";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
    return NextResponse.next();
  }

  // 4. Route Guard: /studio (Admin Center - strictly restricted to actual admins)
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

  // 5. Route Guard: /workspace (Agent Workspace - requires itil/admin/etc.)
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

  // 6. Route Guard: Protected portal subpages
  if (pathname.startsWith("/portal/my-tickets")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 7. Inject verified identity headers downstream (never trust client-supplied copies)
  const requestHeaders = new Headers(req.headers);
  for (const h of IDENTITY_HEADERS) requestHeaders.delete(h);
  if (session) {
    requestHeaders.set("x-auth-user-id", session.actualUser.id);
    requestHeaders.set("x-auth-role", session.primaryRole);
    requestHeaders.set("x-session-id", session.session.id);
    if (session.isImpersonating) {
      requestHeaders.set("x-impersonated-user-id", session.user.id);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/api/:path*",
    "/workspace/:path*",
    "/studio/:path*",
    "/portal/my-tickets/:path*",
    "/login",
  ],
};

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { User as PrismaUser, SysUserSession } from "@prisma/client";

/** User as returned by the db client: passwordHash is globally omitted. */
export type User = Omit<PrismaUser, "passwordHash">;

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionTokenPayload,
} from "./auth-token";

export {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionTokenPayload,
};

// Modular Administrator Roles for delegated enterprise self-management
export const MODULAR_ADMIN_ROLES = [
  "admin",
  "workplace_admin",
  "itil_admin",
  "catalog_admin",
  "cmdb_admin",
  "knowledge_admin",
] as const;

export type ModularAdminRole = (typeof MODULAR_ADMIN_ROLES)[number];

// Role hierarchy for automatic inheritance
export const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: [
    "admin",
    "workplace_admin",
    "itil_admin",
    "catalog_admin",
    "cmdb_admin",
    "knowledge_admin",
    "itil",
    "cab_approver",
    "employee",
    "public",
  ],
  workplace_admin: ["workplace_admin", "employee", "public"],
  itil_admin: ["itil_admin", "itil", "employee", "public"],
  catalog_admin: ["catalog_admin", "employee", "public"],
  cmdb_admin: ["cmdb_admin", "itil", "employee", "public"],
  knowledge_admin: ["knowledge_admin", "employee", "public"],
  itil: ["itil", "employee", "public"],
  cab_approver: ["cab_approver", "employee", "public"],
  employee: ["employee", "public"],
  public: ["public"],
};

export function isModularAdmin(role?: string, roles?: string[]): boolean {
  if (!role && (!roles || roles.length === 0)) return false;
  const all = new Set<string>();
  if (role) all.add(role.toLowerCase().trim());
  if (roles) roles.forEach((r) => all.add(r.toLowerCase().trim()));
  return MODULAR_ADMIN_ROLES.some((modRole) => all.has(modRole));
}

// ------------------------------------------------------------------
// Password Hashing (bcrypt)
// ------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ------------------------------------------------------------------
// DB Role Resolution
// ------------------------------------------------------------------

export function calculateEffectiveRoles(
  primaryRole: string,
  secondaryRolesStr?: string | null,
  groupRolesList?: (string | null | undefined)[]
): string[] {
  const directRoles = new Set<string>();
  if (primaryRole) directRoles.add(primaryRole.trim());

  if (secondaryRolesStr) {
    secondaryRolesStr
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean)
      .forEach((r) => directRoles.add(r));
  }

  if (groupRolesList) {
    for (const gRoles of groupRolesList) {
      if (!gRoles) continue;
      gRoles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
        .forEach((r) => directRoles.add(r));
    }
  }

  const effective = new Set<string>();
  for (const role of directRoles) {
    effective.add(role);
    const inherited = ROLE_HIERARCHY[role] || [];
    for (const inh of inherited) {
      effective.add(inh);
    }
  }

  // Ensure public is always present
  effective.add("public");

  return Array.from(effective);
}

// ------------------------------------------------------------------
// Session Context Types
// ------------------------------------------------------------------

export interface SessionContext {
  session: SysUserSession;
  user: User;           // Effective user (impersonated if active)
  actualUser: User;     // Real logged-in user
  isImpersonating: boolean;
  primaryRole: string;  // Effective primary role
  roles: string[];      // All effective roles from DB
  hasRole: (role: string) => boolean;
  isAdmin: boolean;
}

// ------------------------------------------------------------------
// Server-Side Session Operations
// ------------------------------------------------------------------

export async function createDbSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ session: SysUserSession; token: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      groupMembers: {
        include: { group: true },
      },
    },
  });

  if (!user) {
    throw new Error("User not found to create session");
  }

  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const session = await db.sysUserSession.create({
    data: {
      userId,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    },
  });

  const tokenPayload: SessionTokenPayload = {
    sessionId: session.id,
    userId: user.id,
    role: user.role,
    impersonatedUserId: null,
    exp: expiresAt.getTime(),
  };

  const token = await signSessionToken(tokenPayload);

  return { session, token };
}

export async function setSessionImpersonation(
  sessionId: string,
  targetUserId: string | null
): Promise<{ session: SysUserSession; token: string; effectiveUser: User }> {
  const session = await db.sysUserSession.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  // Strictly check that the actual session user has the admin role in DB!
  if (session.user.role !== "admin") {
    throw new Error("Forbidden: Only administrators can impersonate other users");
  }

  let targetUser: User | null = null;
  if (targetUserId) {
    targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new Error("Target user to impersonate does not exist");
    }
  }

  const updatedSession = await db.sysUserSession.update({
    where: { id: sessionId },
    data: {
      impersonatedUserId: targetUserId || null,
    },
  });

  const effectiveUser = targetUser || session.user;

  const tokenPayload: SessionTokenPayload = {
    sessionId: updatedSession.id,
    userId: session.userId,
    role: effectiveUser.role,
    impersonatedUserId: targetUserId || null,
    exp: updatedSession.expiresAt.getTime(),
  };

  const token = await signSessionToken(tokenPayload);

  return { session: updatedSession, token, effectiveUser };
}

export async function destroySession(sessionId: string): Promise<void> {
  await db.sysUserSession.deleteMany({
    where: { id: sessionId },
  });
}

// ------------------------------------------------------------------
// Resolve Session from Request or Headers
// ------------------------------------------------------------------

function extractTokenFromRequest(req?: Request): string | null {
  if (!req) return null;

  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // 2. Check Cookie
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
        return decodeURIComponent(cookie.substring(SESSION_COOKIE_NAME.length + 1));
      }
    }
  }

  return null;
}

export async function getServerSession(req?: Request): Promise<SessionContext | null> {
  try {
    let rawToken = extractTokenFromRequest(req);

    // If no request passed, try Next.js cookies if in server component / action
    if (!rawToken) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
      } catch {
        // Not in a context with next/headers cookies()
      }
    }

    if (!rawToken) return null;

    let sessionId: string | null = null;

    // Tokens MUST be cryptographically verified signed JWTs
    const verified = await verifySessionToken(rawToken);
    if (verified) {
      sessionId = verified.sessionId;
    } else if (process.env.ALLOW_RAW_SESSION_ID === "true" && rawToken.length >= 20 && !rawToken.includes(".")) {
      // Strictly restricted to local tests when explicitly enabled
      sessionId = rawToken;
    }

    if (!sessionId) return null;

    // Look up session from DB
    const session = await db.sysUserSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            groupMembers: {
              include: { group: true },
            },
          },
        },
        impersonatedUser: {
          include: {
            groupMembers: {
              include: { group: true },
            },
          },
        },
      },
    });

    if (!session) return null;

    // Check expiration
    if (session.expiresAt.getTime() < Date.now()) {
      await db.sysUserSession.deleteMany({ where: { id: sessionId } });
      return null;
    }

    const actualUser = session.user;
    let effectiveUser = actualUser;
    let isImpersonating = false;

    // Evaluate impersonation
    if (session.impersonatedUserId && session.impersonatedUser) {
      if (actualUser.role === "admin") {
        effectiveUser = session.impersonatedUser;
        isImpersonating = true;
      } else {
        // Security guard: actual user is not admin, revoke impersonation
        await db.sysUserSession.update({
          where: { id: sessionId },
          data: { impersonatedUserId: null },
        });
      }
    }

    // Resolve DB roles for the effective user
    const groupRolesList = (effectiveUser as any).groupMembers?.map(
      (gm: any) => gm.group?.roles
    );
    const roles = calculateEffectiveRoles(
      effectiveUser.role,
      effectiveUser.roles,
      groupRolesList
    );

    const isAdmin = roles.includes("admin");

    return {
      session,
      user: effectiveUser,
      actualUser,
      isImpersonating,
      primaryRole: effectiveUser.role,
      roles,
      hasRole: (r: string) => roles.includes(r) || roles.includes("admin"),
      isAdmin,
    };
  } catch (err) {
    console.error("Error in getServerSession:", err);
    return null;
  }
}

// ------------------------------------------------------------------
// Explicit Route Guards & Auth Verification Helpers
// ------------------------------------------------------------------

export class AuthError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Requires a valid, active authenticated session.
 * Throws an AuthError (401) if missing or expired.
 */
export async function requireAuth(req: Request): Promise<SessionContext> {
  const session = await getServerSession(req);
  if (!session || !session.user) {
    throw new AuthError("Authentication required to access this resource", 401, "UNAUTHORIZED");
  }
  return session;
}

/**
 * Requires an active session with administrative privileges (role === 'admin').
 * Throws AuthError (401) if unauthenticated, or AuthError (403) if unauthorized.
 */
export async function requireAdmin(req: Request): Promise<SessionContext> {
  const session = await requireAuth(req);
  if (!session.isAdmin) {
    throw new AuthError("Administrative privileges required to access this resource", 403, "FORBIDDEN");
  }
  return session;
}

/**
 * Requires an active session with any modular admin privilege (admin, workplace_admin, catalog_admin, etc.).
 */
export async function requireModularAdmin(req: Request): Promise<SessionContext> {
  const session = await requireAuth(req);
  if (!session.isAdmin && !isModularAdmin(session.primaryRole, session.roles)) {
    throw new AuthError("Modular or System Administrator privileges required to access this resource", 403, "FORBIDDEN");
  }
  return session;
}

/**
 * Requires an active session with workplace_admin or admin role.
 */
export async function requireWorkplaceAdmin(req: Request): Promise<SessionContext> {
  const session = await requireAuth(req);
  const isAuthorized = session.isAdmin || session.hasRole("workplace_admin");
  if (!isAuthorized) {
    throw new AuthError("Workplace Administrator privileges required for Connected Workplace management", 403, "FORBIDDEN");
  }
  return session;
}

/**
 * Requires an active session with catalog_admin or admin role.
 */
export async function requireCatalogAdmin(req: Request): Promise<SessionContext> {
  const session = await requireAuth(req);
  const isAuthorized = session.isAdmin || session.hasRole("catalog_admin");
  if (!isAuthorized) {
    throw new AuthError("Service Catalog Administrator privileges required for catalog management", 403, "FORBIDDEN");
  }
  return session;
}

/**
 * Requires an active session with itil, admin, or any modular admin role.
 */
export async function requireFulfiller(req: Request): Promise<SessionContext> {
  const session = await requireAuth(req);
  const isAuthorized = session.isAdmin || session.hasRole("itil") || isModularAdmin(session.primaryRole, session.roles);
  if (!isAuthorized) {
    throw new AuthError("ITIL Fulfiller or Administrator privileges required", 403, "FORBIDDEN");
  }
  return session;
}


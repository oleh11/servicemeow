import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { User, SysUserSession } from "@prisma/client";

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

// Role hierarchy for automatic inheritance
export const ROLE_HIERARCHY: Record<string, string[]> = {
  admin: ["admin", "itil", "cab_approver", "employee", "public"],
  itil: ["itil", "employee", "public"],
  cab_approver: ["cab_approver", "employee", "public"],
  employee: ["employee", "public"],
  public: ["public"],
};

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

    // Token might be a signed JWT or a raw session ID (for testing)
    const verified = await verifySessionToken(rawToken);
    if (verified) {
      sessionId = verified.sessionId;
    } else if (rawToken.length >= 20 && !rawToken.includes(".")) {
      // Direct session ID fallback (useful for direct API test clients)
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

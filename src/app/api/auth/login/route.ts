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
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
} from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await req.json();
    const { email, username, password, personaId } = body;

    const identifier = (email || username || personaId || "").trim().toLowerCase();
    const rateLimitKey = `${ipAddress}:${identifier || "anonymous"}`;

    // 1. Check Rate Limit & Account Lockout
    const rateLimit = checkLoginRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many failed login attempts. Account temporarily locked out. Please try again later.",
          code: "ACCOUNT_LOCKED",
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds || 900),
          },
        }
      );
    }

    let user: any = null;

    // 2. Persona bypass handling (STRICTLY ENV-GATED to dev and default disabled)
    if (personaId) {
      const devBypassAllowed =
        process.env.NODE_ENV !== "production" &&
        process.env.ALLOW_DEV_PERSONA_LOGIN === "true";

      if (!devBypassAllowed) {
        return NextResponse.json(
          {
            error: "Password-less persona login is disabled. Please authenticate with email/username and password.",
            code: "PERSONA_LOGIN_DISABLED",
          },
          { status: 403 }
        );
      }

      user = await db.user.findFirst({
        where: {
          OR: [{ id: personaId }, { email: String(personaId).toLowerCase() }, { userName: personaId }],
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
      // 3. Standard Credential Authentication (Email/Username + Password)
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
        omit: { passwordHash: false }, // opt back in: needed for bcrypt comparison only
        include: {
          groupMembers: { include: { group: true } },
        },
      });

      if (!user) {
        recordFailedLogin(rateLimitKey);
        return NextResponse.json(
          { error: "Invalid username, email, or password" },
          { status: 401 }
        );
      }

      // Check if user account is active
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
          const failResult = recordFailedLogin(rateLimitKey);
          return NextResponse.json(
            {
              error: "Invalid username, email, or password",
              remainingAttempts: failResult.remainingAttempts,
            },
            { status: 401 }
          );
        }
      } else {
        // Accounts without a password hash cannot log in with a password.
        // An administrator must set one (Studio > Users, or scripts/seed-passwords.ts).
        recordFailedLogin(rateLimitKey);
        return NextResponse.json(
          { error: "Account credentials uninitialized. Contact platform administrator." },
          { status: 401 }
        );
      }
    }

    // Login successful: Reset failed attempt counters
    resetLoginRateLimit(rateLimitKey);

    // Create DB session
    const userAgent = req.headers.get("user-agent") || undefined;
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

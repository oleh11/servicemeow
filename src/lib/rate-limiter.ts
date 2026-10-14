/**
 * In-Memory Sliding-Window Rate Limiter & Lockout Guard
 * Tracks failed authentication attempts by key (IP / Email / Identifier)
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const loginAttemptStore = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
  retryAfterSeconds?: number;
}

/**
 * Checks if a login attempt is allowed for the given key (IP / Email).
 */
export function checkLoginRateLimit(key: string): RateLimitCheckResult {
  const now = Date.now();
  const record = loginAttemptStore.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Check if actively locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntil: new Date(record.lockedUntil),
      retryAfterSeconds,
    };
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    loginAttemptStore.delete(key);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

/**
 * Records a failed login attempt. If threshold exceeded, triggers lockout.
 */
export function recordFailedLogin(key: string): RateLimitCheckResult {
  const now = Date.now();
  let record = loginAttemptStore.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }

  loginAttemptStore.set(key, record);

  const retryAfterSeconds = record.lockedUntil
    ? Math.ceil((record.lockedUntil - now) / 1000)
    : undefined;

  return {
    allowed: !record.lockedUntil,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts),
    lockedUntil: record.lockedUntil ? new Date(record.lockedUntil) : undefined,
    retryAfterSeconds,
  };
}

/**
 * Clears failed attempts upon a successful login.
 */
export function resetLoginRateLimit(key: string): void {
  loginAttemptStore.delete(key);
}

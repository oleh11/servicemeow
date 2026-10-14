import { describe, it, expect, beforeEach } from "vitest";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
} from "../src/lib/rate-limiter";

describe("Login Rate Limiter & Lockout Guard", () => {
  const testKey = "192.168.1.100:test@servicemeow.io";

  beforeEach(() => {
    resetLoginRateLimit(testKey);
  });

  it("should permit initial login attempts with full quota", () => {
    const status = checkLoginRateLimit(testKey);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(5);
  });

  it("should decrement remaining attempts on failed login", () => {
    recordFailedLogin(testKey);
    const status = checkLoginRateLimit(testKey);
    expect(status.allowed).toBe(true);
    expect(status.remainingAttempts).toBe(4);
  });

  it("should trigger temporary lockout after 5 consecutive failed attempts", () => {
    for (let i = 0; i < 4; i++) {
      const res = recordFailedLogin(testKey);
      expect(res.allowed).toBe(true);
    }

    // 5th attempt triggers lockout
    const finalFail = recordFailedLogin(testKey);
    expect(finalFail.allowed).toBe(false);
    expect(finalFail.lockedUntil).toBeDefined();
    expect(finalFail.retryAfterSeconds).toBeGreaterThan(0);

    // Immediate subsequent check should be blocked
    const check = checkLoginRateLimit(testKey);
    expect(check.allowed).toBe(false);
    expect(check.remainingAttempts).toBe(0);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should reset failed attempt counter upon successful login", () => {
    recordFailedLogin(testKey);
    recordFailedLogin(testKey);
    expect(checkLoginRateLimit(testKey).remainingAttempts).toBe(3);

    resetLoginRateLimit(testKey);
    expect(checkLoginRateLimit(testKey).remainingAttempts).toBe(5);
    expect(checkLoginRateLimit(testKey).allowed).toBe(true);
  });
});

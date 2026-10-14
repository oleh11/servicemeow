import { describe, it, expect, beforeEach } from "vitest";
import { signSessionToken, verifySessionToken, SessionTokenPayload } from "../src/lib/auth-token";

describe("Cryptographic Auth Token Engine", () => {
  const basePayload: SessionTokenPayload = {
    sessionId: "test-session-1234567890",
    userId: "test-user-0987654321",
    role: "admin",
    impersonatedUserId: null,
    exp: Date.now() + 60 * 60 * 1000, // 1 hour in future
  };

  it("should successfully sign and verify a session token", async () => {
    const token = await signSessionToken(basePayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(2);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.sessionId).toBe(basePayload.sessionId);
    expect(verified?.userId).toBe(basePayload.userId);
    expect(verified?.role).toBe(basePayload.role);
    expect(verified?.impersonatedUserId).toBeNull();
  });

  it("should preserve impersonatedUserId when set", async () => {
    const impersonatedPayload: SessionTokenPayload = {
      ...basePayload,
      impersonatedUserId: "target-user-555",
    };
    const token = await signSessionToken(impersonatedPayload);
    const verified = await verifySessionToken(token);
    expect(verified?.impersonatedUserId).toBe("target-user-555");
  });

  it("should reject a tampered token signature", async () => {
    const token = await signSessionToken(basePayload);
    const [payloadB64, sigB64] = token.split(".");
    const tamperedToken = `${payloadB64}.${sigB64}tampered`;

    const verified = await verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it("should reject a tampered payload", async () => {
    const token = await signSessionToken(basePayload);
    const [payloadB64, sigB64] = token.split(".");
    // Modify payload content
    const tamperedPayload = payloadB64.slice(0, -4) + "AAAA";
    const tamperedToken = `${tamperedPayload}.${sigB64}`;

    const verified = await verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it("should reject an expired session token", async () => {
    const expiredPayload: SessionTokenPayload = {
      ...basePayload,
      exp: Date.now() - 5000, // expired 5 seconds ago
    };
    const token = await signSessionToken(expiredPayload);
    const verified = await verifySessionToken(token);
    expect(verified).toBeNull();
  });

  it("should return null for malformed or non-JWT tokens", async () => {
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("invalid-token-no-dots")).toBeNull();
    expect(await verifySessionToken("part1.part2.part3")).toBeNull();
  });
});

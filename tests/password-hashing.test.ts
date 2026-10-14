import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../src/lib/auth";

describe("Bcrypt Password Hashing Engine", () => {
  it("should securely hash a password and verify matching plaintexts", async () => {
    const rawPassword = "SuperSecureCatPassword!2026";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const matches = await comparePassword(rawPassword, hash);
    expect(matches).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const rawPassword = "CorrectPassword123";
    const hash = await hashPassword(rawPassword);

    const matches = await comparePassword("WrongPassword456", hash);
    expect(matches).toBe(false);
  });

  it("should generate distinct salted hashes for the same password", async () => {
    const password = "IdenticalPassword789";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(await comparePassword(password, hash1)).toBe(true);
    expect(await comparePassword(password, hash2)).toBe(true);
  });
});

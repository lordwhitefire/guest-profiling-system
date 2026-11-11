import { describe, it, expect, beforeEach } from "vitest";
import { hashPassword, verifyPassword, getHashOptions } from "../password.js";

describe("password hashing (Argon2id)", () => {
  beforeEach(() => {
    // Set a known pepper for tests.
    process.env.ARGON2_PEPPER = "test-pepper";
  });

  it("hashes and verifies a password correctly", async () => {
    const password = "correct-horse-battery-staple";
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const password = "same-password";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
    // Both should still verify against the same password.
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("uses Argon2id with the correct parameters per OWASP", () => {
    const opts = getHashOptions();
    expect(opts.type).toBe(2); // argon2.argon2id === 2
    expect(opts.memoryCost).toBe(19456);
    expect(opts.timeCost).toBe(2);
    expect(opts.parallelism).toBe(1);
  });

  it("returns false for malformed hash (does not throw)", async () => {
    expect(await verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });
});

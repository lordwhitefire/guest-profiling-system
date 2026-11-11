// =============================================================================
// Encryption helper tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { encryptField, decryptField } from "../src/encryption.js";

const VALID_KEY = "a".repeat(64);  // 32 bytes hex

describe("Encryption helpers", () => {
  it("encrypt + decrypt roundtrip produces the original value", () => {
    const plaintext = "postgres://user:pass@host:5432/db?ssl=true";
    const encrypted = encryptField(plaintext, VALID_KEY);
    const decrypted = decryptField(encrypted, VALID_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext for different plaintexts", () => {
    const a = encryptField("postgres://a", VALID_KEY);
    const b = encryptField("postgres://b", VALID_KEY);
    expect(a.equals(b)).toBe(false);
  });

  it("throws on invalid key length (not 64 chars)", () => {
    expect(() => encryptField("x", "short")).toThrow();
    expect(() => decryptField(Buffer.from("x"), "short")).toThrow();
  });

  it("decryption with wrong key produces garbage (XOR property)", () => {
    const plaintext = "postgres://user:pass@host:5432/db";
    const encrypted = encryptField(plaintext, VALID_KEY);
    const wrongKey = "b".repeat(64);
    const decrypted = decryptField(encrypted, wrongKey);
    expect(decrypted).not.toBe(plaintext);
  });

  it("handles empty plaintext", () => {
    const encrypted = encryptField("", VALID_KEY);
    expect(encrypted.length).toBe(0);
    expect(decryptField(encrypted, VALID_KEY)).toBe("");
  });
});

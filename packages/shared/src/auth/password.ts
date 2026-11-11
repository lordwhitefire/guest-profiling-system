// =============================================================================
// Password hashing — Argon2id
// =============================================================================
// Parameters per OWASP recommendation (as of 2024):
//   memory cost: 19456 KiB (19 MiB)
//   time cost:   2 iterations
//   parallelism: 1 thread
// =============================================================================
// The ARGON2_PEPPER env var is appended to every password before hashing.
// Pepper is server-side secret; never stored in DB. If pepper changes, all
// passwords become invalid (intentional — requires reset).

import argon2 from "argon2";

const PEPPER = process.env.ARGON2_PEPPER ?? "";

if (!PEPPER && process.env.NODE_ENV === "production") {
  // Fail loudly in production if pepper is missing.
  throw new Error(
    "ARGON2_PEPPER environment variable is required in production. " +
    "Generate with: openssl rand -hex 32"
  );
}

const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

/**
 * Hash a password using Argon2id with the configured pepper.
 * Returns the full Argon2 hash string (includes salt + parameters).
 */
export async function hashPassword(password: string): Promise<string> {
  const peppered = password + PEPPER;
  return argon2.hash(peppered, HASH_OPTIONS);
}

/**
 * Verify a password against a stored Argon2id hash.
 * Returns true if the password matches, false otherwise.
 * Constant-time comparison (argon2 library handles this internally).
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const peppered = password + PEPPER;
  try {
    return await argon2.verify(hash, peppered);
  } catch {
    // Hash is malformed or wrong algorithm — treat as verification failure.
    return false;
  }
}

/**
 * Inspect hash parameters — used in tests to assert the configuration is correct.
 */
export function getHashOptions(): argon2.Options {
  return { ...HASH_OPTIONS };
}

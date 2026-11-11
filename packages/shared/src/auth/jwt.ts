// =============================================================================
// JWT — issue and verify
// =============================================================================
// Claims:
//   sub:        user_id (UUID)
//   tenant_id:  tenant_id (UUID)
//   groups:     string[] — one of: "Admin", "RegionalManager", "Receptionist"
//   iat:        issued-at (Unix seconds)
//   exp:        expiration (Unix seconds)
// =============================================================================
// Algorithm: HS256 (HMAC-SHA-256). Symmetric — same secret for sign and verify.
// Asymmetric (RS256 / EdDSA) is overkill for v1 single-deploy; revisit if the
// project ever needs third-party-issued tokens.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "CHANGE_ME_TO_A_32_BYTE_HEX_STRING"
);

const ALG = "HS256";
const ISSUER = "guest-profiling-system";
const AUDIENCE = "gps-users";

const EXPIRES_IN_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 86400);

export interface JwtClaims extends JWTPayload {
  sub: string;        // user_id
  tenant_id: string;  // tenant_id
  groups: string[];   // ["Admin", "RegionalManager", "Receptionist"] subset
}

/**
 * Issue a JWT for the given user.
 * Returns a compact JWT string (header.payload.signature).
 */
export async function issueJwt(input: {
  userId: string;
  tenantId: string;
  groups: string[];
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = {
    sub: input.userId,
    tenant_id: input.tenantId,
    groups: input.groups,
    iat: now,
    exp: now + EXPIRES_IN_SECONDS,
    iss: ISSUER,
    aud: AUDIENCE,
  };
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG, typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + EXPIRES_IN_SECONDS)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(SECRET);
}

/**
 * Verify a JWT. Returns the claims if valid.
 * Throws if the token is expired, tampered, or has the wrong issuer/audience.
 */
export async function verifyJwt(token: string): Promise<JwtClaims> {
  const { payload } = await jwtVerify(token, SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  });
  // Type assertion is safe — we set these claims at issue time and verify above.
  return payload as JwtClaims;
}

/**
 * Returns the configured expiration in seconds — used in tests.
 */
export function getExpiresInSeconds(): number {
  return EXPIRES_IN_SECONDS;
}

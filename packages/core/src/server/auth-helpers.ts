// =============================================================================
// Auth helpers for API routes
// =============================================================================
// Common patterns: extract JWT from cookie, verify it, return claims or
// return a 401/403 response.

import type { NextRequest } from "next/server";
import { verifyJwt, type JwtClaims } from "@gps/shared";
import { unauthorized } from "./response";

export interface AuthResult {
  ok: true;
  claims: JwtClaims;
}

export interface AuthFail {
  ok: false;
  response: ReturnType<typeof unauthorized>;
}

/**
 * Extract and verify the JWT from the request's gps-jwt cookie.
 * Returns the claims on success; a 401 response on failure.
 */
export async function authenticate(
  request: NextRequest,
): Promise<AuthResult | AuthFail> {
  const cookie = request.cookies.get("gps-jwt");
  if (!cookie?.value) {
    return { ok: false, response: unauthorized() };
  }
  try {
    const claims = await verifyJwt(cookie.value);
    return { ok: true, claims };
  } catch {
    return { ok: false, response: unauthorized("Invalid or expired token.") };
  }
}

/**
 * Get a numeric query param with a default value, bounded to a max.
 */
export function getIntQuery(
  request: NextRequest,
  name: string,
  defaultValue: number,
  maxValue: number,
): number {
  const raw = request.nextUrl.searchParams.get(name);
  if (raw === null) return defaultValue;
  const n = Number(raw);
  if (isNaN(n) || n < 1) return defaultValue;
  return Math.min(n, maxValue);
}

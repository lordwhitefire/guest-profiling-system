// =============================================================================
// Tenant scope resolver
// =============================================================================
// Implements Card 2's resolve_property_scope pattern (Behavioral Specification
// Section 4.5). The contract is fail-closed — if the caller's JWT groups do not
// establish a qualifying scope, the call is rejected, never widened.
// =============================================================================
// Trust model (verbatim from Card 2):
//
//   Two claim families feed these decisions, and they are NOT equally
//   trustworthy. cognito:groups (here: groups[]) is set only through admin
//   action — a signed-in user cannot grant themselves a group. custom:property_id
//   (here: tenant_id) is a user attribute; authoritative only because the
//   user-pool clients do not list it in WriteAttributes. Access level is always
//   derived from groups first, and the attribute claim only narrows further.
//
// Re-implementation in TypeScript with JWT group claims instead of Cognito.

import type { JwtClaims } from "./jwt.js";

const CHAIN_LEVEL_GROUPS = new Set(["Admin"]);
const REGIONAL_GROUPS = new Set(["RegionalManager"]);

export type TenantScope =
  | { kind: "single-tenant"; tenantId: string }
  | { kind: "chain-level" }
  | { kind: "regional"; region: string }
  | { kind: "denied"; reason: string };

/**
 * Resolve the tenant scope for a list / collection query.
 *
 * Rules (fail-closed):
 *   1. If caller has tenant_id claim (any group): pinned to that tenant.
 *      Caller cannot widen to chain or move to another tenant.
 *   2. If caller has chain-level group (Admin) and no tenant_id: chain-level.
 *   3. If caller has regional group (RegionalManager) and no tenant_id
 *      but has a region claim: regional scope.
 *   4. If caller has regional group and no region: DENIED.
 *   5. Anything else (no tenant_id and no qualifying group): DENIED.
 *      Never widened to chain.
 */
export function resolveTenantScope(claims: JwtClaims): TenantScope {
  const callerTenantId = claims.tenant_id ?? null;
  const groups = new Set(claims.groups ?? []);

  // Rule 1: caller has a tenant_id claim — pinned to that tenant.
  if (callerTenantId) {
    return { kind: "single-tenant", tenantId: callerTenantId };
  }

  // Rule 2: chain-level group without tenant_id claim — chain-level access.
  if (groups.has("Admin") || hasIntersection(groups, CHAIN_LEVEL_GROUPS)) {
    return { kind: "chain-level" };
  }

  // Rule 3: regional group without tenant_id but with region claim.
  if (hasIntersection(groups, REGIONAL_GROUPS)) {
    // v1 single-tenant deploy does not exercise regional scope.
    // For now, we treat RegionalManager as needing a region claim or denied.
    const region = (claims as unknown as { region?: string }).region;
    if (region) {
      return { kind: "regional", region };
    }
    // Rule 4: regional caller without region claim — DENIED, not widened.
    return {
      kind: "denied",
      reason: "Regional scope requires a region claim; none present.",
    };
  }

  // Rule 5: anything else — DENIED. Never widen to chain.
  return {
    kind: "denied",
    reason:
      "Caller has no tenant_id claim and no qualifying group. " +
      "Absence of a property claim is not proof of chain-level access.",
  };
}

function hasIntersection<T>(a: Set<T>, b: Set<T>): boolean {
  for (const item of a) {
    if (b.has(item)) return true;
  }
  return false;
}

/**
 * Verify that a caller can access a specific tenant's data.
 * Used by single-record handlers (GET /guests/{id}) — equivalent to Card 2's
 * verify_property_access.
 *
 * Throws an Error (which the API handler should catch and convert to 403)
 * if access is denied.
 */
export function verifyTenantAccess(
  claims: JwtClaims,
  recordTenantId: string
): void {
  const scope = resolveTenantScope(claims);

  switch (scope.kind) {
    case "single-tenant":
      if (scope.tenantId !== recordTenantId) {
        throw new ForbiddenError("Access denied: tenant mismatch.");
      }
      return;
    case "chain-level":
      return; // Chain-level sees all tenants.
    case "regional":
      // v1: regional scope is not exercised. If we get here, deny by default.
      // Multi-tenant deploy (Phase 3) will add region-to-tenant mapping.
      throw new ForbiddenError(
        "Regional scope cannot be verified in v1; denied by default."
      );
    case "denied":
      throw new ForbiddenError(scope.reason);
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

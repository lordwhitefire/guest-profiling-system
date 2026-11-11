import { describe, it, expect } from "vitest";
import { resolveTenantScope, verifyTenantAccess, ForbiddenError } from "../tenant-scope.js";
import type { JwtClaims } from "../jwt.js";

function makeClaims(overrides: Partial<JwtClaims> = {}): JwtClaims {
  return {
    sub: "user-1",
    tenant_id: "tenant-1",
    groups: ["Receptionist"],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
    iss: "guest-profiling-system",
    aud: "gps-users",
    ...overrides,
  };
}

describe("tenant scope resolver (Card 2 fail-closed pattern)", () => {
  it("rule 1: caller with tenant_id claim is pinned to that tenant", () => {
    const claims = makeClaims({
      tenant_id: "tenant-A",
      groups: ["Receptionist"],
    });
    const scope = resolveTenantScope(claims);
    expect(scope.kind).toBe("single-tenant");
    if (scope.kind === "single-tenant") {
      expect(scope.tenantId).toBe("tenant-A");
    }
  });

  it("rule 2: chain-level Admin without tenant_id gets chain-level scope", () => {
    const claims = makeClaims({
      tenant_id: undefined as unknown as string,
      groups: ["Admin"],
    });
    // delete tenant_id to simulate absent claim
    const claimsWithoutTenant = { ...claims, tenant_id: "" };
    const scope = resolveTenantScope(claimsWithoutTenant);
    expect(scope.kind).toBe("chain-level");
  });

  it("rule 3: RegionalManager with region claim gets regional scope", () => {
    const claims = makeClaims({
      tenant_id: "",
      groups: ["RegionalManager"],
      region: "west-africa",
    } as unknown as JwtClaims);
    const scope = resolveTenantScope(claims);
    expect(scope.kind).toBe("regional");
    if (scope.kind === "regional") {
      expect(scope.region).toBe("west-africa");
    }
  });

  it("rule 4: RegionalManager without region claim is DENIED (not widened)", () => {
    const claims = makeClaims({
      tenant_id: "",
      groups: ["RegionalManager"],
    });
    const scope = resolveTenantScope(claims);
    expect(scope.kind).toBe("denied");
  });

  it("rule 5: caller with no tenant_id and no qualifying group is DENIED", () => {
    const claims = makeClaims({
      tenant_id: "",
      groups: ["Receptionist"],
    });
    const scope = resolveTenantScope(claims);
    expect(scope.kind).toBe("denied");
    if (scope.kind === "denied") {
      expect(scope.reason).toMatch(/not proof of chain-level access/);
    }
  });

  it("rule 5b: caller with no tenant_id and no groups at all is DENIED", () => {
    const claims = makeClaims({
      tenant_id: "",
      groups: [],
    });
    const scope = resolveTenantScope(claims);
    expect(scope.kind).toBe("denied");
  });

  it("verifyTenantAccess: single-tenant caller can access their own tenant", () => {
    const claims = makeClaims({
      tenant_id: "tenant-A",
      groups: ["Receptionist"],
    });
    expect(() => verifyTenantAccess(claims, "tenant-A")).not.toThrow();
  });

  it("verifyTenantAccess: single-tenant caller cannot access another tenant", () => {
    const claims = makeClaims({
      tenant_id: "tenant-A",
      groups: ["Receptionist"],
    });
    expect(() => verifyTenantAccess(claims, "tenant-B")).toThrow(ForbiddenError);
  });

  it("verifyTenantAccess: chain-level Admin can access any tenant", () => {
    const claims = makeClaims({
      tenant_id: "",
      groups: ["Admin"],
    });
    expect(() => verifyTenantAccess(claims, "tenant-A")).not.toThrow();
    expect(() => verifyTenantAccess(claims, "tenant-B")).not.toThrow();
  });

  it("verifyTenantAccess: denied scope throws ForbiddenError", () => {
    const claims = makeClaims({
      tenant_id: "",
      groups: ["Receptionist"],
    });
    expect(() => verifyTenantAccess(claims, "tenant-A")).toThrow(ForbiddenError);
  });
});

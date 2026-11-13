// =============================================================================
// PATCH /api/users/[userId] — edit a team member (admin-only)
// =============================================================================
// Updates email, role groups, and active state inside the caller's tenant.
// The JWT tenant claim is the only tenant scope accepted; a user from another
// tenant is reported as not found.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import type { User, UserRole } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, forbidden, badRequest, notFound, serverError } from "@/src/server/response";

export const runtime = "nodejs";

const ROLES: UserRole[] = ["Admin", "RegionalManager", "Receptionist"];

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  if (!auth.claims.groups?.includes("Admin")) {
    return forbidden("Only admins can edit users.");
  }

  const scope = resolveTenantScope(auth.claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");
  const tenantId = scope.tenantId;

  const { userId } = await context.params;
  let body: { email?: string; groups?: string[]; active?: boolean };
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  if (body.email !== undefined && (!body.email || !body.email.includes("@"))) {
    return badRequest("VALIDATION_ERROR", "email must be a valid address.");
  }
  if (body.groups !== undefined) {
    if (!Array.isArray(body.groups) || body.groups.length === 0) {
      return badRequest("VALIDATION_ERROR", "groups must be a non-empty array.");
    }
    if (body.groups.some((g) => !ROLES.includes(g as UserRole))) {
      return badRequest("VALIDATION_ERROR", "groups contains an unknown role.");
    }
  }
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return badRequest("VALIDATION_ERROR", "active must be a boolean.");
  }

  const db = getDb();
  try {
    const rows = await db`
      UPDATE users
      SET email = COALESCE(${body.email ?? null}, email),
          groups = COALESCE(${body.groups ?? null}, groups),
          active = COALESCE(${body.active ?? null}, active),
          updated_at = NOW()
      WHERE user_id = ${userId}
        AND tenant_id = ${tenantId}
        AND deleted_at IS NULL
      RETURNING user_id, tenant_id, email, groups, active, created_at, updated_at
    `;
    const r = rows[0] as Record<string, unknown> | undefined;
    if (!r) return notFound("User not found in this workspace.");

    const user: User = {
      userId: String(r.user_id),
      tenantId: String(r.tenant_id),
      email: String(r.email),
      passwordHash: "",
      groups: r.groups as UserRole[],
      active: Boolean(r.active),
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
      deletedAt: null,
    };
    return ok<User>(user);
  } catch (err) {
    console.error("[PATCH /api/users/[userId]] Failed:", err);
    return serverError();
  }
}

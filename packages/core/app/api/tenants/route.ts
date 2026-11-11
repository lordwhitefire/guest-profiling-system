// =============================================================================
// GET /api/tenants — list tenants the caller can see
// POST /api/tenants — create a new tenant (admin-only)
// =============================================================================
// v1: single-tenant deploy. The admin sees their own tenant only. Creating
// a new tenant is reserved for chain-level admins (future); in v1, the
// superuser seeds the first tenant via the migration's seed.sql.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import type { Tenant } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, forbidden, badRequest, serverError } from "@/src/server/response";
import { writeAuditLog } from "@/src/server/audit/log";

export const runtime = "nodejs";

// ── GET /api/tenants ───────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  // v1: caller sees their own tenant only. Multi-tenant chain-level would
  // need a different code path that lists all tenants in the caller's chain.
  if (!claims.tenant_id) {
    return forbidden("Caller has no tenant_id claim.");
  }

  const db = getDb();
  try {
    const rows = await db`
      SELECT tenant_id, name, created_at, updated_at, deleted_at
      FROM tenants
      WHERE tenant_id = ${claims.tenant_id}
        AND deleted_at IS NULL
    `;
    const tenants: Tenant[] = rows.map((r: Record<string, unknown>) => ({
      tenantId: String(r.tenant_id),
      name: String(r.name),
      createdAt: new Date(r.created_at as string),
      updatedAt: new Date(r.updated_at as string),
      deletedAt: null,
    }));
    return ok<Tenant[]>(tenants);
  } catch (err) {
    console.error("[GET /api/tenants] Failed:", err);
    return serverError();
  }
}

// ── POST /api/tenants — create a new tenant ────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  // Only admins in the same tenant can create child tenants (v1: superuser
  // seeds the first tenant; this endpoint is for adding sub-tenants).
  if (!claims.groups?.includes("Admin")) {
    return forbidden("Only admins can create tenants.");
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return badRequest("VALIDATION_ERROR", "name is required.");
  }

  const db = getDb();
  try {
    const rows = await db`
      INSERT INTO tenants (name) VALUES (${body.name.trim()})
      RETURNING tenant_id, name, created_at, updated_at
    `;
    if (rows.length === 0) {
      return serverError();
    }
    const row = rows[0] as Record<string, unknown>;
    const tenant: Tenant = {
      tenantId: String(row.tenant_id),
      name: String(row.name),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      deletedAt: null,
    };

    await writeAuditLog(db, {
      tenantId: claims.tenant_id,
      actorUserId: claims.sub,
      action: "CREATE",
      entityType: "tenant",
      entityId: tenant.tenantId,
      before: null,
      after: tenant as unknown as Record<string, unknown>,
    });

    return ok(tenant);
  } catch (err) {
    console.error("[POST /api/tenants] Failed:", err);
    return serverError();
  }
}

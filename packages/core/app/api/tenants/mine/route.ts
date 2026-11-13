// =============================================================================
// GET /api/tenants/mine — list every tenant the caller has a membership in
// =============================================================================
// Returns the caller's active tenant (from the JWT) plus every other tenant
// they can switch to. Used by the hotel-switcher modal in workspace-app.tsx.

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, forbidden, serverError } from "@/src/server/response";

export const runtime = "nodejs";

interface TenantSummary {
  tenantId: string;
  name: string;
  groups: string[];
  isActive: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  if (!claims.sub || !claims.tenant_id) {
    return forbidden("Caller is missing required claims.");
  }

  const db = getDb();
  try {
    const rows = await db`
      SELECT m.tenant_id, m.groups, t.name
      FROM tenant_memberships m
      JOIN tenants t ON t.tenant_id = m.tenant_id
      WHERE m.user_id = ${claims.sub}
        AND m.is_active = TRUE
        AND m.deleted_at IS NULL
        AND t.deleted_at IS NULL
      ORDER BY (m.tenant_id = ${claims.tenant_id}) DESC, t.name ASC
    `;
    const tenants: TenantSummary[] = rows.map((r: Record<string, unknown>) => ({
      tenantId: String(r.tenant_id),
      name: String(r.name),
      groups: (r.groups as string[]) ?? [],
      isActive: String(r.tenant_id) === claims.tenant_id,
    }));
    return ok<TenantSummary[]>(tenants);
  } catch (err) {
    console.error("[GET /api/tenants/mine] Failed:", err);
    return serverError();
  }
}

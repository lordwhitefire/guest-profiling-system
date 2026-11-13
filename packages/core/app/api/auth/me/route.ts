// =============================================================================
// GET /api/auth/me — current user + active workspace
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, serverError } from "@/src/server/response";

export const runtime = "nodejs";

interface MeResponse {
  userId: string;
  email: string;
  groups: string[];
  activeTenantId: string;
  activeTenantName: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  try {
    const db = getDb();
    const users = await db`
      SELECT u.email, u.groups
      FROM users u
      WHERE u.user_id = ${claims.sub}
        AND u.deleted_at IS NULL
      LIMIT 1
    `;
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 }
      );
    }

    const tenants = await db`
      SELECT t.name, m.groups
      FROM tenants t
      LEFT JOIN tenant_memberships m
        ON m.tenant_id = t.tenant_id
       AND m.user_id = ${claims.sub}
       AND m.is_active = TRUE
       AND m.deleted_at IS NULL
      WHERE t.tenant_id = ${claims.tenant_id}
        AND t.deleted_at IS NULL
      LIMIT 1
    `;

    const user = users[0] as { email: string; groups: string[] };
    const tenant = tenants[0] as { name: string; groups: string[] | null } | undefined;

    return ok<MeResponse>({
      userId: claims.sub,
      email: user.email,
      groups: tenant?.groups && tenant.groups.length > 0 ? tenant.groups : user.groups,
      activeTenantId: claims.tenant_id,
      activeTenantName: tenant?.name ?? "Hotel workspace",
    });
  } catch (err) {
    console.error("[GET /api/auth/me] Failed:", err);
    return serverError();
  }
}

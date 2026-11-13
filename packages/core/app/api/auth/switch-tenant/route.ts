// =============================================================================
// POST /api/auth/switch-tenant
// =============================================================================
// Switches the caller's active tenant. The caller must already have a
// membership in the target tenant (tenant_memberships row).
//
// On success: re-issues the JWT with the new tenant_id as the active claim,
// sets the new cookie, and returns the new active tenant.
//
// This is the server half of the hotel switcher (the UI half is the
// gps-hotel-badge onClick in workspace-app.tsx, which opens a modal that
// lists the user's memberships and calls this endpoint).

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@gps/shared";
import { verifyJwt, issueJwt } from "@gps/shared/auth/jwt";
import type { ApiResponse } from "@gps/shared";
import { writeAuditLog } from "@/src/server/audit/log";

export const runtime = "nodejs";

interface SwitchBody {
  tenantId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get("gps-jwt");
  if (!cookie?.value) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not signed in." } },
      { status: 401 }
    );
  }

  let claims;
  try {
    claims = await verifyJwt(cookie.value);
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "UNAUTHORIZED", message: "Session expired." } },
      { status: 401 }
    );
  }

  let body: SwitchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const targetTenantId = (body.tenantId || "").trim();
  if (!targetTenantId) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "VALIDATION_ERROR", message: "tenantId is required." } },
      { status: 400 }
    );
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTenantId)) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "VALIDATION_ERROR", message: "tenantId must be a UUID." } },
      { status: 400 }
    );
  }

  const db = getDb();

  const rows = await db`
    SELECT m.tenant_id, m.groups, t.name AS tenant_name
    FROM tenant_memberships m
    JOIN tenants t ON t.tenant_id = m.tenant_id
    WHERE m.user_id = ${claims.sub}
      AND m.tenant_id = ${targetTenantId}::uuid
      AND m.is_active = TRUE
      AND m.deleted_at IS NULL
      AND t.deleted_at IS NULL
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "FORBIDDEN", message: "You do not have access to that hotel." } },
      { status: 403 }
    );
  }

  const row = rows[0] as { tenant_id: string; groups: string[]; tenant_name: string };

  const token = await issueJwt({
    userId: claims.sub,
    tenantId: row.tenant_id,
    groups: row.groups,
  });

  await writeAuditLog(db, {
    tenantId: row.tenant_id,
    actorUserId: claims.sub,
    action: "UPDATE",
    entityType: "user",
    entityId: claims.sub,
    before: { activeTenantId: claims.tenant_id },
    after: { activeTenantId: row.tenant_id },
  });

  const response = NextResponse.json<ApiResponse<{ activeTenantId: string; activeTenantName: string }>>(
    {
      success: true,
      data: {
        activeTenantId: row.tenant_id,
        activeTenantName: row.tenant_name,
      },
    }
  );

  response.cookies.set("gps-jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 86400),
  });

  return response;
}

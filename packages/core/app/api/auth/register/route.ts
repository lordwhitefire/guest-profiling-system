// =============================================================================
// POST /api/auth/register
// =============================================================================
// Admin-only. Creates a new user in a tenant.
// In TASK-001, this endpoint exists but is protected by an admin-bootstrap
// mechanism (the first admin user is created by a CLI script, not by this
// endpoint — TODO: document in docs/runbook/new-tenant.md).

import { NextResponse, type NextRequest } from "next/server";
import {
  getDb,
  hashPassword,
  verifyJwt,
  resolveTenantScope,
  registerUserRequestSchema,
  type ApiResponse,
} from "@gps/shared";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookie = request.cookies.get("gps-jwt");
  if (!cookie?.value) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  let claims;
  try {
    claims = await verifyJwt(cookie.value);
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token." } },
      { status: 401 }
    );
  }

  const scope = resolveTenantScope(claims);
  if (scope.kind !== "chain-level") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "FORBIDDEN", message: "Admin access required." } },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = registerUserRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid registration data.",
          details: parsed.error.issues,
        },
      },
      { status: 400 }
    );
  }

  const { email, password, groups, tenantId } = parsed.data;
  const passwordHash = await hashPassword(password);
  const db = getDb();

  try {
    const rows = await db`
      INSERT INTO users (tenant_id, email, password_hash, groups)
      VALUES (${tenantId}, ${email}, ${passwordHash}, ${groups})
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: { code: "INSERT_FAILED", message: "Failed to create user." } },
        { status: 500 }
      );
    }

    const row = rows[0] as { user_id: string };
    return NextResponse.json<ApiResponse<{ userId: string }>>(
      { success: true, data: { userId: row.user_id } },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: { code: "CONFLICT", message: "Email already exists in this tenant." } },
        { status: 409 }
      );
    }
    throw err;
  }
}

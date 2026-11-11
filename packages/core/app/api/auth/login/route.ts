// =============================================================================
// POST /api/auth/login
// =============================================================================
// Accepts email + password. Verifies against the users table. On success,
// issues a JWT and sets it as an httpOnly cookie.

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@gps/shared";
import { verifyPassword, issueJwt } from "@gps/shared";
import { loginRequestSchema, type ApiResponse } from "@gps/shared";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
          details: parsed.error.issues,
        },
      },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const db = getDb();

  // Look up user by email across all tenants (email is unique per tenant, not
  // global — but for login we look up by email; if multiple tenants have the
  // same email, we accept the first active match in v1 single-tenant deploy).
  // TODO(TASK-005): disambiguate by tenant_id from subdomain or login form.
  // Look up user by email. postgres.js returns rows with snake_case column names.
  // TODO(TASK-005): disambiguate by tenant_id from subdomain or login form.
  const rows = await db`
    SELECT * FROM users
    WHERE email = ${email}
      AND deleted_at IS NULL
      AND active = TRUE
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password." } },
      { status: 401 }
    );
  }

  const row = rows[0] as {
    user_id: string;
    tenant_id: string;
    password_hash: string;
    groups: string[];
  };
  const passwordValid = await verifyPassword(password, row.password_hash);
  if (!passwordValid) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password." } },
      { status: 401 }
    );
  }

  const token = await issueJwt({
    userId: row.user_id,
    tenantId: row.tenant_id,
    groups: row.groups,
  });

  const response = NextResponse.json<ApiResponse<{ userId: string }>>(
    { success: true, data: { userId: row.user_id } }
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

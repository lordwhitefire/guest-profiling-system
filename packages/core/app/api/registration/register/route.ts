// =============================================================================
// POST /api/registration/register
// =============================================================================
// Writes ONE raw row into the active hotel's messy source database. The
// adapter stays read-only; this route uses the tenant's write connection.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { AdapterError, registerRawRow } from "@/src/server/adapters/service";
import type { ApiResponse } from "@gps/shared";

export const runtime = "nodejs";

interface RegisterBody {
  name?: string;
  email?: string;
  phone?: string;
  room?: string;
  checkIn?: string;
  checkOut?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;

  const scope = resolveTenantScope(auth.claims);
  if (scope.kind === "denied") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "FORBIDDEN", message: scope.reason } },
      { status: 403 }
    );
  }
  if (scope.kind !== "single-tenant") {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "FORBIDDEN", message: "Chain-level scope not supported in v1." } },
      { status: 403 }
    );
  }

  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }

  try {
    const data = await registerRawRow(getDb(), scope.tenantId, auth.claims.sub, {
      name: body.name ?? "",
      email: body.email ?? null,
      phone: body.phone ?? null,
      room: body.room ?? null,
      checkIn: body.checkIn ?? null,
      checkOut: body.checkOut ?? null,
    });
    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
  } catch (err) {
    if (err instanceof AdapterError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    console.error("[POST /api/registration/register] Hotel DB write failed:", err);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          code: "HOTEL_DB_WRITE_FAILED",
          message: err instanceof Error ? err.message : "Write to the hotel source database failed.",
        },
      },
      { status: 502 }
    );
  }
}

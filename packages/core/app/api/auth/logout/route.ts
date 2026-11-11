// =============================================================================
// POST /api/auth/logout
// =============================================================================
// Clears the gps-jwt cookie.

import { NextResponse } from "next/server";
import type { ApiResponse } from "@gps/shared";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json<ApiResponse<never>>({ success: true });
  response.cookies.delete("gps-jwt");
  return response;
}

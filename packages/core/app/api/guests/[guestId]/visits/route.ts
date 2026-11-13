// =============================================================================
// GET /api/guests/{guestId}/visits
// =============================================================================
// Derived visit history. Each row is one raw source row linked to the clean
// profile — the hotel source database has no visit table. Owner-only access.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, verifyTenantAccess, ForbiddenError } from "@gps/shared";
import type { GuestVisit } from "@gps/shared";
import { authenticate, getIntQuery } from "@/src/server/auth-helpers";
import { GuestsRepository } from "@/src/server/guests/repository";
import { ok, badRequest, forbidden, notFound, serverError } from "@/src/server/response";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guestId: string }> },
): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const { guestId } = await params;
  if (!guestId) {
    return badRequest("VALIDATION_ERROR", "guestId path parameter is required.");
  }

  const limit = getIntQuery(request, "limit", 100, 500);
  const db = getDb();
  const repo = new GuestsRepository(db);

  try {
    const guest = await repo.getById(guestId, claims.tenant_id);
    if (!guest) {
      return notFound("Guest not found.");
    }

    try {
      verifyTenantAccess(claims, guest.tenantId);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return forbidden("You do not have permission to access this resource.");
      }
      throw err;
    }

    const visits: GuestVisit[] = await repo.getVisitsForGuest(
      guestId,
      claims.tenant_id,
      { limit },
    );

    return ok<GuestVisit[]>(visits, { page: 1, limit, total: visits.length });
  } catch (err) {
    console.error("[GET /api/guests/{guestId}/visits] Failed:", err);
    return serverError();
  }
}

// =============================================================================
// GET /api/guests/{guestId}/reservations
// =============================================================================
// Linked spoke per Card 2 §4.2. Paginated, ordered by check_in DESC.
// Owner-only access.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, verifyTenantAccess, ForbiddenError } from "@gps/shared";
import type { Reservation } from "@gps/shared";
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

  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const page = getIntQuery(request, "page", 1, Number.MAX_SAFE_INTEGER);
  const limit = getIntQuery(request, "limit", 20, 100);

  const db = getDb();
  const repo = new GuestsRepository(db);

  try {
    // Fetch the guest first (for owner check).
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

    const reservations: Reservation[] = await repo.getReservationsForGuest(
      guestId,
      { status, page, limit },
    );

    return ok<Reservation[]>(reservations, { page, limit, total: reservations.length });
  } catch (err) {
    console.error("[GET /api/guests/{guestId}/reservations] Failed:", err);
    return serverError();
  }
}

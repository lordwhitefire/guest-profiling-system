// =============================================================================
// GET /api/guests/{guestId}/loyalty
// =============================================================================
// Linked spoke per Card 2 §4.2. Owner-only access.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, verifyTenantAccess, ForbiddenError } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { GuestsRepository } from "@/src/server/guests/repository";
import { ok, badRequest, forbidden, notFound, serverError } from "@/src/server/response";

export const runtime = "nodejs";

interface LoyaltyResponse {
  tier: string;
  pointsBalance: number;
  totalStays: number;
}

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

    const loyalty = await repo.getLoyaltyForGuest(guestId);
    if (!loyalty) {
      return notFound("Guest has no loyalty profile.");
    }

    const response: LoyaltyResponse = {
      tier: loyalty.tier,
      pointsBalance: loyalty.pointsBalance,
      totalStays: loyalty.totalStays,
    };
    return ok(response);
  } catch (err) {
    console.error("[GET /api/guests/{guestId}/loyalty] Failed:", err);
    return serverError();
  }
}

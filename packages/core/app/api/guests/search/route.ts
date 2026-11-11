// =============================================================================
// GET /api/guests/search?q=... (live search — Feature F1)
// =============================================================================
// Returns up to 20 matching guest profiles, ranked by:
//   1. Exact email match (case-insensitive)
//   2. Exact phone match (digits-only)
//   3. Prefix match on first_name / last_name (case-insensitive)
//   4. Substring match on first_name / last_name / email (case-insensitive; trigram)
//
// Tenant-scoped via the shared resolver (Card 2 fail-closed pattern).
// Excludes soft-deleted guests.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import type { Guest } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { GuestsRepository } from "@/src/server/guests/repository";
import { ok, forbidden, serverError } from "@/src/server/response";
import { validateSearchQuery } from "@/src/server/guests/search-ranking";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  // Staff-only — guest list access is restricted per Card 2.
  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") {
    return forbidden(scope.reason);
  }
  if (scope.kind !== "single-tenant") {
    return forbidden(
      `Scope "${scope.kind}" not supported in v1 search endpoint.`,
    );
  }

  const q = request.nextUrl.searchParams.get("q") ?? "";

  // Validate the query. Short queries return empty array (graceful, not 400).
  const validationError = validateSearchQuery(q);
  if (validationError) {
    return ok<Guest[]>([], { page: 1, limit: 20, total: 0 });
  }

  const db = getDb();
  const repo = new GuestsRepository(db);

  try {
    const guests = await repo.search(scope.tenantId, q);
    return ok<Guest[]>(guests, { page: 1, limit: 20, total: guests.length });
  } catch (err) {
    console.error("[GET /api/guests/search] Failed:", err);
    return serverError();
  }
}

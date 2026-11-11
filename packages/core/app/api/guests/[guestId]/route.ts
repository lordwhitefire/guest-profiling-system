// =============================================================================
// GET /api/guests/{guestId} + PUT /api/guests/{guestId}
// =============================================================================
// GET: Card 2 §4.2 — get a guest profile (owner-only; sensitive fields stripped).
// PUT: Card 2 §4.2 — update a guest profile (owner-only).

import { NextResponse, type NextRequest } from "next/server";
import { getDb, verifyTenantAccess, ForbiddenError } from "@gps/shared";
import { updateGuestRequestSchema } from "@gps/shared";
import { authenticate, getIntQuery } from "@/src/server/auth-helpers";
import { GuestsRepository } from "@/src/server/guests/repository";
import { writeAuditLog } from "@/src/server/audit/log";
import {
  ok,
  badRequest,
  forbidden,
  notFound,
  serverError,
} from "@/src/server/response";
import { stripSensitiveFields } from "@/src/server/guests/sensitive-fields";

export const runtime = "nodejs";

// ── GET /api/guests/{guestId} ──────────────────────────────────────────────

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

    // Owner-only access check (Card 2 §4.3 — verify_property_access).
    // For guests, "owner" means the caller's tenant matches the guest's tenant.
    // (In the AWS sample, owner = cognito_sub match; in our model, guests
    // don't have logins, so we use tenant scope.)
    try {
      verifyTenantAccess(claims, guest.tenantId);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return forbidden("You do not have permission to access this resource.");
      }
      throw err;
    }

    // Strip sensitive fields per Card 2 §4.4.
    const safeGuest = stripSensitiveFields(
      guest as unknown as Record<string, unknown>,
    );
    return ok(safeGuest);
  } catch (err) {
    console.error("[GET /api/guests/{guestId}] Failed:", err);
    return serverError();
  }
}

// ── PUT /api/guests/{guestId} ─────────────────────────────────────────────

export async function PUT(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  const parsed = updateGuestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("VALIDATION_ERROR", "Invalid update data.", parsed.error.issues);
  }

  const db = getDb();
  const repo = new GuestsRepository(db);

  try {
    // Fetch the existing guest first (for owner check + audit before-state).
    const existing = await repo.getById(guestId, claims.tenant_id);
    if (!existing) {
      return notFound("Guest not found.");
    }

    // Owner-only check.
    try {
      verifyTenantAccess(claims, existing.tenantId);
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return forbidden("You do not have permission to update this resource.");
      }
      throw err;
    }

    const updated = await repo.update(guestId, existing.tenantId, parsed.data);
    if (!updated) {
      return notFound("Guest not found.");
    }

    // Audit log (best-effort).
    await writeAuditLog(db, {
      tenantId: existing.tenantId,
      actorUserId: claims.sub,
      action: "UPDATE",
      entityType: "guest",
      entityId: existing.guestId,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    // Strip sensitive fields from response.
    const safeGuest = stripSensitiveFields(
      updated as unknown as Record<string, unknown>,
    );
    return ok(safeGuest);
  } catch (err) {
    console.error("[PUT /api/guests/{guestId}] Failed:", err);
    return serverError();
  }
}

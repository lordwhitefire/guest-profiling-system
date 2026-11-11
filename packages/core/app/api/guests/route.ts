// =============================================================================
// POST /api/guests (create) + GET /api/guests (list)
// =============================================================================
// POST: Card 2 §4.2 — create a new guest.
// GET: Card 2 §4.2 — list guests (PMS staff only; tenant-scoped).

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@gps/shared";
import { createGuestRequestSchema } from "@gps/shared";
import { resolveTenantScope } from "@gps/shared";
import type { Guest } from "@gps/shared";
import { authenticate, getIntQuery } from "@/src/server/auth-helpers";
import { GuestsRepository } from "@/src/server/guests/repository";
import { writeAuditLog } from "@/src/server/audit/log";
import {
  ok,
  created,
  badRequest,
  forbidden,
  conflict,
  serverError,
} from "@/src/server/response";

export const runtime = "nodejs";

// ── POST /api/guests ───────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  // The caller's tenant_id is where the guest is created.
  // Per Card 2: caller.sub == guest.cognito_sub in the AWS sample. In our
  // simplified model, the guest doesn't have a cognito_sub; we use the
  // caller's tenant_id directly. v1: only staff creates guests (e.g., a
  // receptionist creating a walk-in). CRS-style self-service is deferred.
  const tenantId = claims.tenant_id;
  if (!tenantId) {
    return forbidden("Caller has no tenant_id claim; cannot create guests.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  const parsed = createGuestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("VALIDATION_ERROR", "Invalid guest data.", parsed.error.issues);
  }

  const db = getDb();
  const repo = new GuestsRepository(db);

  try {
    const guest = await repo.create(tenantId, parsed.data);

    // Audit log (best-effort).
    await writeAuditLog(db, {
      tenantId,
      actorUserId: claims.sub,
      action: "CREATE",
      entityType: "guest",
      entityId: guest.guestId,
      before: null,
      after: guest as unknown as Record<string, unknown>,
    });

    return created(guest);
  } catch (err: unknown) {
    // Postgres unique violation = email already exists in this tenant.
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return conflict("Email already exists in this tenant.");
    }
    console.error("[POST /api/guests] Failed:", err);
    return serverError();
  }
}

// ── GET /api/guests (list) ─────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  // Per Card 2 §4.5: list endpoints go through the tenant scope resolver.
  // Fail-closed if the caller's groups don't establish a qualifying scope.
  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") {
    return forbidden(scope.reason);
  }

  // For v1 (single-tenant deploy), the scope is always single-tenant.
  // In multi-tenant, chain-level would need a different query path.
  // For now, we only handle the single-tenant case.
  if (scope.kind !== "single-tenant") {
    return forbidden(
      `Scope "${scope.kind}" not supported in v1 list endpoint. Use single-tenant scope.`,
    );
  }

  const page = getIntQuery(request, "page", 1, Number.MAX_SAFE_INTEGER);
  const limit = getIntQuery(request, "limit", 20, 100);

  const db = getDb();
  const repo = new GuestsRepository(db);

  try {
    const { guests, total } = await repo.list(scope.tenantId, { page, limit });
    return ok<Guest[]>(guests, { page, limit, total });
  } catch (err) {
    console.error("[GET /api/guests] Failed:", err);
    return serverError();
  }
}

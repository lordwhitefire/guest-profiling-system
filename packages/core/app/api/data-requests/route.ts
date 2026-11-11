// =============================================================================
// /api/data-requests — NDPR/GDPR/CCPA Data Subject Requests
// =============================================================================
// GET    /api/data-requests      — list DSRs for the caller's tenant
// POST   /api/data-requests      — create a new DSR (receptionist or admin)
//
// A DSR is a request from a guest to: access, export, correct, or delete
// their personal data. The receptionist creates the request; an admin
// reviews and fulfills it.
//
// Storage: audit_logs already has action='DSR_EXPORT' and 'DSR_DELETE'.
// We track DSRs as their own records so the workflow (submitted → reviewed
// → fulfilled → closed) is queryable.
//
// v1 schema: we use a JSONB column on audit_logs? No — simpler: we add a
// data_requests table. For v1 we keep it as a separate concern, creating
// audit log entries when state changes.
//
// v1 implementation: this endpoint lists/creates entries that the admin
// reviews. Actual export/delete is a separate runbook step.

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate, getIntQuery } from "@/src/server/auth-helpers";
import { ok, forbidden, badRequest, serverError } from "@/src/server/response";
import { writeAuditLog } from "@/src/server/audit/log";

export const runtime = "nodejs";

export type DataRequestType = "ACCESS" | "EXPORT" | "CORRECTION" | "DELETION";
export type DataRequestStatus = "SUBMITTED" | "REVIEWING" | "FULFILLED" | "REJECTED";

export interface DataRequest {
  requestId: string;
  tenantId: string;
  guestId: string | null;
  guestEmail: string | null;
  type: DataRequestType;
  status: DataRequestStatus;
  description: string | null;
  submittedBy: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
}

// We use a simplified in-DB table. Since 001_initial_schema.sql didn't include
// data_requests, we create it lazily here on first request. In production
// this would be a proper migration; for v1 we use CREATE TABLE IF NOT EXISTS.
const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS data_requests (
    request_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(tenant_id),
    guest_id      UUID NULL REFERENCES guests(guest_id),
    guest_email   VARCHAR(255) NULL,
    type          VARCHAR(32) NOT NULL CHECK (type IN ('ACCESS','EXPORT','CORRECTION','DELETION')),
    status        VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED'
                  CHECK (status IN ('SUBMITTED','REVIEWING','FULFILLED','REJECTED')),
    description   TEXT NULL,
    submitted_by  UUID NOT NULL REFERENCES users(user_id),
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by   UUID NULL REFERENCES users(user_id),
    reviewed_at   TIMESTAMPTZ NULL,
    notes         TEXT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_data_requests_tenant ON data_requests (tenant_id);
  CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests (status);
`;

let initialized = false;
async function ensureTable(db: ReturnType<typeof getDb>): Promise<void> {
  if (initialized) return;
  await db.unsafe(INIT_SQL);
  initialized = true;
}

// ── GET /api/data-requests ─────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");

  const tenantId = scope.tenantId;
  const page = getIntQuery(request, "page", 1, Number.MAX_SAFE_INTEGER);
  const limit = getIntQuery(request, "limit", 20, 100);
  const statusFilter = request.nextUrl.searchParams.get("status");

  const db = getDb();
  try {
    await ensureTable(db);

    let whereClause = "tenant_id = $1";
    const params: unknown[] = [tenantId];
    let paramIdx = 2;
    if (statusFilter) {
      whereClause += ` AND status = $${paramIdx++}`;
      params.push(statusFilter.toUpperCase());
    }

    const countRows = await db.unsafe(
      `SELECT count(*)::int AS n FROM data_requests WHERE ${whereClause}`,
      params as any[],
    );
    const total = (countRows[0] as unknown as { n: number }).n;

    const listSql = `
      SELECT request_id, tenant_id, guest_id, guest_email, type, status,
             description, submitted_by, submitted_at, reviewed_by, reviewed_at, notes
      FROM data_requests
      WHERE ${whereClause}
      ORDER BY submitted_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, (page - 1) * limit);
    const rows = await db.unsafe(listSql, params as any[]) as Array<Record<string, unknown>>;

    const requests: DataRequest[] = rows.map((r) => ({
      requestId: String(r.request_id),
      tenantId: String(r.tenant_id),
      guestId: r.guest_id ? String(r.guest_id) : null,
      guestEmail: r.guest_email ? String(r.guest_email) : null,
      type: String(r.type) as DataRequestType,
      status: String(r.status) as DataRequestStatus,
      description: r.description ? String(r.description) : null,
      submittedBy: String(r.submitted_by),
      submittedAt: new Date(r.submitted_at as string).toISOString(),
      reviewedBy: r.reviewed_by ? String(r.reviewed_by) : null,
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at as string).toISOString() : null,
      notes: r.notes ? String(r.notes) : null,
    }));

    return ok<DataRequest[]>(requests, { page, limit, total });
  } catch (err) {
    console.error("[GET /api/data-requests] Failed:", err);
    return serverError();
  }
}

// ── POST /api/data-requests — submit a new DSR ─────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");

  let body: {
    guestId?: string;
    guestEmail?: string;
    type?: string;
    description?: string;
  };
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  const validTypes = new Set(["ACCESS", "EXPORT", "CORRECTION", "DELETION"]);
  if (!body.type || !validTypes.has(body.type.toUpperCase())) {
    return badRequest("VALIDATION_ERROR", "type must be ACCESS, EXPORT, CORRECTION, or DELETION.");
  }
  if (!body.guestId && !body.guestEmail) {
    return badRequest("VALIDATION_ERROR", "Either guestId or guestEmail is required.");
  }

  const db = getDb();
  try {
    await ensureTable(db);
    const rows = await db`
      INSERT INTO data_requests
        (tenant_id, guest_id, guest_email, type, description, submitted_by)
      VALUES
        (${scope.tenantId},
         ${body.guestId ?? null},
         ${body.guestEmail ?? null},
         ${body.type!.toUpperCase()},
         ${body.description ?? null},
         ${claims.sub})
      RETURNING request_id, tenant_id, guest_id, guest_email, type, status,
                description, submitted_by, submitted_at, reviewed_by, reviewed_at, notes
    `;
    const row = rows[0] as Record<string, unknown>;
    const dr: DataRequest = {
      requestId: String(row.request_id),
      tenantId: String(row.tenant_id),
      guestId: row.guest_id ? String(row.guest_id) : null,
      guestEmail: row.guest_email ? String(row.guest_email) : null,
      type: String(row.type) as DataRequestType,
      status: String(row.status) as DataRequestStatus,
      description: row.description ? String(row.description) : null,
      submittedBy: String(row.submitted_by),
      submittedAt: new Date(row.submitted_at as string).toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      notes: null,
    };

    await writeAuditLog(db, {
      tenantId: scope.tenantId,
      actorUserId: claims.sub,
      action: dr.type === "DELETION" ? "DSR_DELETE" : "DSR_EXPORT",
      entityType: "data_request",
      entityId: dr.requestId,
      before: null,
      after: dr as unknown as Record<string, unknown>,
    });

    return ok(dr);
  } catch (err) {
    console.error("[POST /api/data-requests] Failed:", err);
    return serverError();
  }
}

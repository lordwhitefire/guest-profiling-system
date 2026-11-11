// =============================================================================
// GET /api/settings — read tenant settings
// PUT /api/settings — update tenant settings
// =============================================================================
// v1: settings are stored as a JSONB column on the tenants table. We add
// the column lazily via CREATE TABLE IF NOT EXISTS-style migration on first
// request. In production this would be a proper migration.
//
// Settings shape:
//   { emailNotifications, autoSync, multiFactorAuth,
//     guestProfileMatching, dataRetentionDays }

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, forbidden, badRequest, serverError } from "@/src/server/response";
import { writeAuditLog } from "@/src/server/audit/log";

export const runtime = "nodejs";

export interface TenantSettings {
  emailNotifications: boolean;
  autoSync: boolean;
  multiFactorAuth: boolean;
  guestProfileMatching: boolean;
  dataRetentionDays: number;
}

const DEFAULT_SETTINGS: TenantSettings = {
  emailNotifications: true,
  autoSync: true,
  multiFactorAuth: false,
  guestProfileMatching: true,
  dataRetentionDays: 365,
};

const INIT_SQL = `
  ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
`;

let initialized = false;
async function ensureColumn(db: ReturnType<typeof getDb>): Promise<void> {
  if (initialized) return;
  await db.unsafe(INIT_SQL);
  initialized = true;
}

// ── GET /api/settings ───────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");

  const db = getDb();
  try {
    await ensureColumn(db);
    const rows = await db`
      SELECT settings FROM tenants WHERE tenant_id = ${scope.tenantId}
    `;
    const row = rows[0] as { settings: Record<string, unknown> | null } | undefined;
    const stored = row?.settings ?? {};
    // Merge with defaults so missing fields get sensible values
    const settings: TenantSettings = {
      ...DEFAULT_SETTINGS,
      ...(stored as Partial<TenantSettings>),
    };
    return ok(settings);
  } catch (err) {
    console.error("[GET /api/settings] Failed:", err);
    return serverError();
  }
}

// ── PUT /api/settings ───────────────────────────────────────────────────────

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticate(request);
  if (!auth.ok) return auth.response;
  const claims = auth.claims;

  if (!claims.groups?.includes("Admin")) {
    return forbidden("Only admins can update settings.");
  }

  const scope = resolveTenantScope(claims);
  if (scope.kind === "denied") return forbidden(scope.reason);
  if (scope.kind !== "single-tenant") return forbidden("Chain-level scope not supported in v1.");

  let body: Partial<TenantSettings>;
  try {
    body = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }

  const db = getDb();
  try {
    await ensureColumn(db);
    // Read current settings
    const currentRows = await db`
      SELECT settings FROM tenants WHERE tenant_id = ${scope.tenantId}
    `;
    const current = (currentRows[0] as { settings: Record<string, unknown> | null })?.settings ?? {};
    const merged = { ...DEFAULT_SETTINGS, ...current, ...body };
    await db`
      UPDATE tenants SET settings = ${JSON.stringify(merged)}::jsonb
      WHERE tenant_id = ${scope.tenantId}
    `;

    await writeAuditLog(db, {
      tenantId: scope.tenantId,
      actorUserId: claims.sub,
      action: "UPDATE",
      entityType: "tenant",
      entityId: scope.tenantId,
      before: current,
      after: merged,
    });

    return ok<TenantSettings>(merged as TenantSettings);
  } catch (err) {
    console.error("[PUT /api/settings] Failed:", err);
    return serverError();
  }
}

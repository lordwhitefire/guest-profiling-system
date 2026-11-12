// =============================================================================
// GET /api/settings — read tenant settings
// PUT /api/settings — update tenant settings
// =============================================================================
// v1: settings are stored as a JSONB column on the tenants table. We add
// the column lazily via CREATE TABLE IF NOT EXISTS-style migration on first
// request. In production this would be a proper migration.
//
// Settings shape (packages/shared/src/types/index.ts):
//   { emailNotifications, autoSync, multiFactorAuth,
//     guestProfileMatching, dataRetentionDays,
//     defaultLanguage, timezone, dateFormat,
//     matchingSensitivity, syncFrequencyMinutes }

import { NextResponse, type NextRequest } from "next/server";
import { getDb, resolveTenantScope, type TenantSettings } from "@gps/shared";
import { authenticate } from "@/src/server/auth-helpers";
import { ok, forbidden, badRequest, serverError } from "@/src/server/response";
import { writeAuditLog } from "@/src/server/audit/log";

export const runtime = "nodejs";

type BooleanKey = "emailNotifications" | "autoSync" | "multiFactorAuth" | "guestProfileMatching";

export const DEFAULT_SETTINGS: TenantSettings = {
  emailNotifications: true,
  autoSync: true,
  multiFactorAuth: false,
  guestProfileMatching: true,
  dataRetentionDays: 365,
  defaultLanguage: "en-US",
  timezone: "Africa/Lagos",
  dateFormat: "DD/MM/YYYY",
  matchingSensitivity: "balanced",
  syncFrequencyMinutes: 15,
};

const ALLOWED = {
  defaultLanguage: ["en-US", "en-GB"],
  timezone: ["Africa/Lagos", "UTC"],
  dateFormat: ["DD/MM/YYYY", "MM/DD/YYYY"],
  matchingSensitivity: ["strict", "balanced", "loose"],
  syncFrequencyMinutes: [15, 30, 60],
  dataRetentionDays: [90, 365, 1095, 2555],
} as const;

/**
 * Keep only settings keys we know, with values we accept. Anything else is
 * dropped rather than stored — a PUT never corrupts the settings blob.
 * Exported for unit tests (no database needed).
 */
export function sanitizeSettingsUpdate(body: unknown): Partial<TenantSettings> {
  if (typeof body !== "object" || body === null) return {};
  const input = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of ["emailNotifications", "autoSync", "multiFactorAuth", "guestProfileMatching"] as BooleanKey[]) {
    if (typeof input[key] === "boolean") out[key] = input[key];
  }
  for (const key of Object.keys(ALLOWED) as Array<keyof typeof ALLOWED>) {
    const value = input[key as string];
    const allowed = ALLOWED[key] as readonly (string | number)[];
    if (typeof value === "string" || typeof value === "number") {
      if ((allowed as readonly (string | number)[]).includes(value)) out[key as string] = value;
    }
  }
  return out as Partial<TenantSettings>;
}

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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return badRequest("BAD_REQUEST", "Invalid JSON body.");
  }
  const body = sanitizeSettingsUpdate(raw);

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

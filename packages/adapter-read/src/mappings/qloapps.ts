// =============================================================================
// QloApps source mapping — Card 4
// =============================================================================
// Maps QloApps' PREFIX_customer table to our guests table.
// Per Behavioral Specification Section 6.6:
//
//   id_customer → source_ref (string)
//   firstname   → first_name (max 32 chars)
//   lastname    → last_name (max 32 chars)
//   email       → email (lowercased + trimmed)
//   phone       → phone (E.164 without +)
//   birthday    → date_of_birth (0000-00-00 → null)
//   newsletter  → comm_prefs.email_opt_in
//   optin       → comm_prefs.marketing_opt_in
//   deleted     → deleted_at (1 → NOW(); 0 → null)
//   date_add    → created_at
//   date_upd    → updated_at
//   is_guest    → NOT stored
//
// NEVER READ:
//   passwd, secure_key, ip_registration_newsletter, last_passwd_gen
// (These are security/privacy columns; reading them would be a violation.)

import type { SourceMapping, SourceRow, MappedGuest, SourceSchema } from "./types.js";

// QloApps uses a configurable table prefix (default ps_, but customizable).
// For v1 we hardcode ps_customer. When a real hotel's install uses a
// different prefix, the mapping needs a small one-line update.
// TODO: make the prefix configurable via adapter_connections.config JSONB.
const QLOAPPS_TABLE_NAME = "ps_customer";

// Explicit allow-list of columns to SELECT. This is the security boundary —
// any column not in this list is never read from the source DB.
const QLOAPPS_ALLOWED_COLUMNS = [
  "id_customer",
  "firstname",
  "lastname",
  "email",
  "phone",
  "birthday",
  "newsletter",
  "optin",
  "deleted",
  "date_add",
  "date_upd",
] as const;

const QLOAPPS_FORBIDDEN_COLUMNS = [
  "passwd",
  "secure_key",
  "ip_registration_newsletter",
  "last_passwd_gen",
] as const;

const QLOAPPS_SCHEMA: SourceSchema = {
  tableName: QLOAPPS_TABLE_NAME,
  columns: [
    { name: "id_customer", type: "int", nullable: false },
    { name: "firstname", type: "varchar(32)", nullable: false },
    { name: "lastname", type: "varchar(32)", nullable: false },
    { name: "email", type: "varchar(128)", nullable: false },
    { name: "phone", type: "varchar(32)", nullable: true },
    { name: "birthday", type: "date", nullable: true },
    { name: "newsletter", type: "tinyint(1)", nullable: false },
    { name: "optin", type: "tinyint(1)", nullable: false },
    { name: "deleted", type: "tinyint(1)", nullable: false },
    { name: "date_add", type: "datetime", nullable: false },
    { name: "date_upd", type: "datetime", nullable: false },
  ],
  primaryKeys: ["id_customer"],
  // SELECT explicitly lists allowed columns; forbidden columns are not in the list.
  selectSql: `SELECT ${QLOAPPS_ALLOWED_COLUMNS.join(", ")} FROM ${QLOAPPS_TABLE_NAME}`,
  whereClause: null,
};

export const qloappsMapping: SourceMapping = {
  pmsType: "qloapps",
  schema: QLOAPPS_SCHEMA,
  mapRow(row: SourceRow): MappedGuest {
    return {
      source_ref: String(row.id_customer ?? ""),
      first_name: truncate(String(row.firstname ?? ""), 32),
      last_name: truncate(String(row.lastname ?? ""), 32),
      email: lowercaseAndTrim(row.email),
      phone: normalizePhone(row.phone),
      date_of_birth: parseBirthday(row.birthday),
      preferences: {},
      comm_prefs: {
        email_opt_in: toBool(row.newsletter),
        sms_opt_in: false,                    // QloApps has no SMS opt-in
        push_opt_in: false,                    // QloApps has no push opt-in
        marketing_opt_in: toBool(row.optin),
      },
      // Set deleted_at only if deleted=1; clear if 0.
      // Per Card 1's idempotent upsert pattern, we DELETE + INSERT per chunk,
      // so the deleted_at value here is what gets written.
      deleted_at: toBool(row.deleted) ? new Date() : null,
      created_at: parseDateTime(row.date_add),
      updated_at: parseDateTime(row.date_upd),
    };
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

function lowercaseAndTrim(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toLowerCase();
  return s.length > 0 ? s : null;
}

/**
 * Normalize phone to E.164 digits-only (no +, no spaces, no dashes).
 * Per Card 4 §6.5: phone format is not enforced at the source DB level;
 * our adapter normalizes on ingress.
 *
 * TODO: tenant-configurable default country code. v1 doesn't guess — if the
 * source phone lacks a country code, we store it as-is and the receptionist
 * screen displays it raw.
 */
function normalizePhone(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

/**
 * Parse QloApps birthday column. Per Card 4 §6.5: may be "0000-00-00" (legacy
 * MySQL zero date). We treat that as null.
 */
function parseBirthday(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const s = String(value);
  if (s === "0000-00-00" || s === "") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse QloApps datetime column. Returns a Date object.
 */
function parseDateTime(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value === null || value === undefined) return new Date();
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Convert QloApps TINYINT(1) to boolean.
 * 1 → true; 0 → false; null/undefined → false.
 */
function toBool(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  }
  return false;
}

/**
 * Export the forbidden columns list for tests to assert against.
 */
export const FORBIDDEN_COLUMNS = QLOAPPS_FORBIDDEN_COLUMNS;

/**
 * Export the allowed columns list for tests to assert against.
 */
export const ALLOWED_COLUMNS = QLOAPPS_ALLOWED_COLUMNS;

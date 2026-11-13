// =============================================================================
// Adapter service — one source of truth for read, sync, test and registration
// =============================================================================
// The source database is the hotel PMS. The clean database is ours. This
// module never writes to the clean guests table from a source read; links do
// that. Registration writes one raw PMS row and nothing else.

import type { Db } from "@gps/shared";
import postgres from "postgres";
import { writeAuditLog } from "@/src/server/audit/log";
import { decryptConnectionUrl } from "./connection-crypto";

export type ConnectionKind = "read" | "write";

export interface AdapterConnection {
  connectionId: string;
  pmsType: string;
  dsn: string;
}

export interface SyncResult {
  tenantId: string;
  scannedRows: number;
  newLinks: number;
  newProfiles: number;
  updatedProfiles: number;
  jobId: string;
}

export interface TestResult {
  connected: boolean;
  isReadOnly: boolean;
  pmsType: string;
  latencyMs?: number;
  error?: string;
}

export interface RegisterInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  room?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
}

export interface RegisterResult {
  sourceTable: string;
  sourceRowId: string;
  hotelCreatedAt: string;
}

export class AdapterError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 409
  ) {
    super(message);
    this.name = "AdapterError";
  }
}

interface RawVisit {
  sourceTable: string;
  sourceRowId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  roomType: string | null;
  checkIn: string | null;
  checkOut: string | null;
  sourceCreatedAt: string | null;
  payload: Record<string, unknown>;
}

interface QloappsRow {
  source_row_id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  newsletter: number | null;
  optin: number | null;
  date_add: Date | string | null;
  date_upd: Date | string | null;
}

interface GuestsRawRow {
  source_row_id: string;
  raw_first_name: string | null;
  raw_last_name: string | null;
  raw_email: string | null;
  raw_phone: string | null;
  raw_room_type: string | null;
  raw_check_in: string | null;
  raw_check_out: string | null;
  created_at: Date | string | null;
}

export async function getAdapterConnection(
  db: Db,
  tenantId: string,
  kind: ConnectionKind
): Promise<AdapterConnection | null> {
  const rows =
    kind === "read"
      ? await db`
          SELECT connection_id, pms_type, connection_url_encrypted
          FROM adapter_connections
          WHERE tenant_id = ${tenantId}
            AND is_read_only = TRUE
            AND deleted_at IS NULL
          ORDER BY created_at DESC, connection_id DESC
          LIMIT 1
        `
      : await db`
          SELECT connection_id, pms_type, connection_url_encrypted
          FROM adapter_connections
          WHERE tenant_id = ${tenantId}
            AND is_read_only = FALSE
            AND deleted_at IS NULL
          ORDER BY created_at DESC, connection_id DESC
          LIMIT 1
        `;

  if (rows.length === 0) return null;
  const row = rows[0] as {
    connection_id: string;
    pms_type: string;
    connection_url_encrypted: Buffer | Uint8Array;
  };

  let dsn: string;
  try {
    dsn = decryptConnectionUrl(row.connection_url_encrypted);
  } catch (err) {
    console.error("[adapter] Connection decrypt failed:", err);
    throw new AdapterError(
      "DECRYPT_FAILED",
      "Could not decrypt the adapter connection URL.",
      500
    );
  }

  return {
    connectionId: row.connection_id,
    pmsType: row.pms_type,
    dsn,
  };
}

export async function syncTenant(
  db: Db,
  tenantId: string,
  actorUserId: string | null
): Promise<SyncResult> {
  const conn = await getAdapterConnection(db, tenantId, "read");
  if (!conn) {
    throw new AdapterError(
      "NO_READ_CONNECTION",
      "This hotel has no read-only adapter connection configured."
    );
  }

  const jobId = `adapter-sync-${new Date().toISOString()}`;
  const source = postgres(conn.dsn, { max: 1, idle_timeout: 5, connect_timeout: 5 });

  try {
    const rawRows = await readSourceRows(source, conn.pmsType);
    let newLinks = 0;
    let newProfiles = 0;

    for (const raw of rawRows) {
      // Check the link BEFORE creating a profile. A contactless row must not
      // create a fresh orphan profile on every run.
      const existing = await db`
        SELECT guest_id
        FROM guest_profile_links
        WHERE tenant_id = ${tenantId}
          AND source_table = ${raw.sourceTable}
          AND source_row_id = ${raw.sourceRowId}
        LIMIT 1
      `;
      if (existing.length > 0) continue;

      const match = await findMatchingProfile(db, tenantId, raw);
      let guestId: string;
      if (match) {
        guestId = match.guestId;
        await refreshProfileFromRaw(db, tenantId, guestId, raw, match.restore);
      } else {
        const created = await db`
          INSERT INTO guests (
            tenant_id, source_ref, first_name, last_name, email, phone,
            last_stay_date, created_at, updated_at
          ) VALUES (
            ${tenantId},
            ${`${raw.sourceTable}:${raw.sourceRowId}`},
            ${raw.firstName},
            ${raw.lastName},
            ${raw.email},
            ${raw.phone},
            ${raw.sourceCreatedAt ? new Date(raw.sourceCreatedAt).toISOString().slice(0, 10) : null}::date,
            NOW(), NOW()
          )
          RETURNING guest_id
        `;
        guestId = String((created[0] as { guest_id: string }).guest_id);
        newProfiles++;
      }

      const inserted = await db`
        INSERT INTO guest_profile_links (
          tenant_id, guest_id, source_table, source_row_id,
          source_created_at, source_payload, linked_at, linked_by_job
        ) VALUES (
          ${tenantId},
          ${guestId}::uuid,
          ${raw.sourceTable},
          ${raw.sourceRowId},
          ${raw.sourceCreatedAt ?? null},
          ${JSON.stringify(raw.payload)}::jsonb,
          NOW(),
          ${jobId}
        )
        ON CONFLICT (tenant_id, source_table, source_row_id) DO NOTHING
        RETURNING guest_id
      `;

      if (inserted.length > 0) {
        newLinks++;
      }
    }

    // Recompute every linked profile, not only the rows inserted in this run.
    // A previous run may have been interrupted after inserting a link but
    // before updating its profile, so skipping existing links would leave a
    // stale visit count forever.
    const recomputed = await db`
      UPDATE guests g
      SET total_stays = sub.cnt,
          last_stay_date = sub.latest,
          updated_at = NOW()
      FROM (
        SELECT guest_id,
               COUNT(*)::int AS cnt,
               MAX(source_created_at)::date AS latest
        FROM guest_profile_links
        WHERE tenant_id = ${tenantId}
        GROUP BY guest_id
      ) sub
      WHERE g.guest_id = sub.guest_id
        AND g.tenant_id = ${tenantId}
      RETURNING g.guest_id
    `;
    const updatedProfiles = recomputed.length;

    await writeAuditLog(db, {
      tenantId,
      actorUserId,
      action: "SYNC",
      entityType: "adapter",
      entityId: null,
      before: null,
      after: {
        jobId,
        pmsType: conn.pmsType,
        scannedRows: rawRows.length,
        newLinks,
        newProfiles,
        updatedProfiles,
      },
    });

    return {
      tenantId,
      scannedRows: rawRows.length,
      newLinks,
      newProfiles,
      updatedProfiles,
      jobId,
    };
  } finally {
    await source.end();
  }
}

export async function testAdapterConnection(
  db: Db,
  tenantId: string
): Promise<TestResult> {
  const conn = await getAdapterConnection(db, tenantId, "read");
  if (!conn) {
    return {
      connected: false,
      isReadOnly: false,
      pmsType: "(none)",
      error: "No read-only adapter connection is configured for this hotel.",
    };
  }

  const started = Date.now();
  const source = postgres(conn.dsn, { max: 1, idle_timeout: 5, connect_timeout: 5 });
  try {
    const one = await source`
      SELECT 1 AS ok,
             current_setting('transaction_read_only') AS ro
    `;
    const row = one[0] as { ok: number; ro: string };
    const isReadOnly = row.ro === "on";
    return {
      connected: true,
      isReadOnly,
      pmsType: conn.pmsType,
      latencyMs: Date.now() - started,
      ...(isReadOnly
        ? {}
        : { error: "Connection is NOT read-only. The DSN must force read-only transactions." }),
    };
  } catch (err) {
    return {
      connected: false,
      isReadOnly: false,
      pmsType: conn.pmsType,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Connection failed.",
    };
  } finally {
    await source.end();
  }
}

export async function registerRawRow(
  db: Db,
  tenantId: string,
  actorUserId: string | null,
  input: RegisterInput
): Promise<RegisterResult> {
  const conn = await getAdapterConnection(db, tenantId, "write");
  if (!conn) {
    throw new AdapterError(
      "NO_WRITE_CONNECTION",
      "This hotel has no write-capable adapter connection configured. " +
        "An admin must configure one before registration can write a raw row to the hotel source database."
    );
  }

  const name = input.name.trim();
  if (!name) {
    throw new AdapterError("VALIDATION_ERROR", "name is required.", 400);
  }
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new AdapterError("VALIDATION_ERROR", "email is required.", 400);
  }

  const source = postgres(conn.dsn, { max: 1, idle_timeout: 5, connect_timeout: 5 });
  try {
    const result =
      conn.pmsType === "qloapps"
        ? await insertQloappsRow(source, name, email, input.phone)
        : await insertCustomRawRow(source, name, email, input);

    await writeAuditLog(db, {
      tenantId,
      actorUserId,
      action: "CREATE",
      entityType: "registration",
      entityId: null,
      before: null,
      after: {
        sourceTable: result.sourceTable,
        sourceRowId: result.sourceRowId,
        rawName: name,
        rawEmail: email,
        rawPhone: normalizePhone(input.phone),
        rawRoomType: input.room ?? null,
        rawCheckIn: input.checkIn ?? null,
        rawCheckOut: input.checkOut ?? null,
        hotelCreatedAt: result.hotelCreatedAt,
      },
    });

    return result;
  } finally {
    await source.end();
  }
}

async function readSourceRows(
  source: ReturnType<typeof postgres>,
  pmsType: string
): Promise<RawVisit[]> {
  if (pmsType === "qloapps") {
    const rows = await source<QloappsRow[]>`
      SELECT id_customer::text AS source_row_id,
             firstname, lastname, email, phone,
             birthday::text AS birthday,
             newsletter, optin,
             date_add, date_upd
      FROM ps_customer
      WHERE deleted = 0
      ORDER BY date_add ASC, id_customer ASC
    `;
    return rows.map((r) => ({
      sourceTable: "ps_customer",
      sourceRowId: r.source_row_id,
      firstName: cleanName(r.firstname),
      lastName: cleanName(r.lastname),
      email: normalizeEmail(r.email),
      phone: normalizePhone(r.phone),
      roomType: null,
      checkIn: null,
      checkOut: null,
      sourceCreatedAt: toIsoDate(r.date_add),
      payload: {
        id_customer: r.source_row_id,
        firstname: r.firstname,
        lastname: r.lastname,
        email: r.email,
        phone: r.phone,
        birthday: r.birthday,
        newsletter: r.newsletter,
        optin: r.optin,
        date_add: r.date_add,
        date_upd: r.date_upd,
      },
    }));
  }

  if (pmsType === "custom") {
    const rows = await source<GuestsRawRow[]>`
      SELECT id::text AS source_row_id,
             raw_first_name, raw_last_name, raw_email, raw_phone,
             raw_room_type, raw_check_in, raw_check_out, created_at
      FROM guests_raw
      ORDER BY created_at ASC, id ASC
    `;
    return rows.map((r) => ({
      sourceTable: "guests_raw",
      sourceRowId: r.source_row_id,
      firstName: cleanName(r.raw_first_name),
      lastName: cleanName(r.raw_last_name),
      email: normalizeEmail(r.raw_email),
      phone: normalizePhone(r.raw_phone),
      roomType: r.raw_room_type,
      checkIn: r.raw_check_in,
      checkOut: r.raw_check_out,
      sourceCreatedAt: toIsoDate(r.created_at),
      payload: {
        id: r.source_row_id,
        raw_first_name: r.raw_first_name,
        raw_last_name: r.raw_last_name,
        raw_email: r.raw_email,
        raw_phone: r.raw_phone,
        raw_room_type: r.raw_room_type,
        raw_check_in: r.raw_check_in,
        raw_check_out: r.raw_check_out,
      },
    }));
  }

  throw new AdapterError(
    "UNSUPPORTED_PMS",
    `Adapter sync does not support PMS type "${pmsType}" yet.`,
    400
  );
}

interface ProfileMatch {
  guestId: string;
  restore: boolean;
}

async function findMatchingProfile(
  db: Db,
  tenantId: string,
  raw: RawVisit
): Promise<ProfileMatch | null> {
  // Email is the stronger identity signal. Active profiles win over
  // soft-deleted ones; a source row that is active can revive a deleted
  // profile rather than violating the (tenant_id, email) unique constraint.
  if (raw.email) {
    const byEmail = await db`
      SELECT guest_id
      FROM guests
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND lower(email) = lower(${raw.email})
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    if (byEmail.length > 0) {
      return { guestId: String((byEmail[0] as { guest_id: string }).guest_id), restore: false };
    }
  }

  if (raw.phone) {
    const byPhone = await db`
      SELECT guest_id
      FROM guests
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND phone = ${raw.phone}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    if (byPhone.length > 0) {
      return { guestId: String((byPhone[0] as { guest_id: string }).guest_id), restore: false };
    }
  }

  if (raw.email) {
    const deletedByEmail = await db`
      SELECT guest_id
      FROM guests
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NOT NULL
        AND lower(email) = lower(${raw.email})
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    if (deletedByEmail.length > 0) {
      return { guestId: String((deletedByEmail[0] as { guest_id: string }).guest_id), restore: true };
    }
  }

  if (raw.phone) {
    const deletedByPhone = await db`
      SELECT guest_id
      FROM guests
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NOT NULL
        AND phone = ${raw.phone}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    if (deletedByPhone.length > 0) {
      return { guestId: String((deletedByPhone[0] as { guest_id: string }).guest_id), restore: true };
    }
  }

  return null;
}

async function refreshProfileFromRaw(
  db: Db,
  tenantId: string,
  guestId: string,
  raw: RawVisit,
  restore: boolean
): Promise<void> {
  await db`
    UPDATE guests
    SET first_name = COALESCE(${raw.firstName}, first_name),
        last_name = COALESCE(${raw.lastName}, last_name),
        email = CASE
          WHEN ${raw.email}::text IS NULL THEN email
          WHEN EXISTS (
            SELECT 1 FROM guests other
            WHERE other.tenant_id = ${tenantId}
              AND lower(other.email) = lower(${raw.email}::text)
              AND other.guest_id <> ${guestId}::uuid
          ) THEN email
          ELSE ${raw.email}::text
        END,
        phone = COALESCE(${raw.phone}, phone),
        deleted_at = CASE WHEN ${restore}::boolean THEN NULL ELSE deleted_at END,
        updated_at = NOW()
    WHERE guest_id = ${guestId}::uuid
  `;
}

async function insertQloappsRow(
  source: ReturnType<typeof postgres>,
  name: string,
  email: string,
  phone: string | null | undefined
): Promise<RegisterResult> {
  const firstSpace = name.indexOf(" ");
  const firstname = truncate(firstSpace > 0 ? name.slice(0, firstSpace) : name, 32);
  const lastname = truncate(firstSpace > 0 ? name.slice(firstSpace + 1) : "", 32);
  const normalizedPhone = normalizePhone(phone);

  const rows = await source`
    INSERT INTO ps_customer (
      firstname, lastname, email, phone,
      birthday, newsletter, optin, deleted, date_add, date_upd
    ) VALUES (
      ${firstname}, ${lastname}, ${truncate(email, 128)}, ${normalizedPhone},
      NULL, 0, 0, 0, NOW(), NOW()
    )
    RETURNING id_customer::text AS source_row_id, date_add
  `;
  const row = rows[0] as { source_row_id: string; date_add: Date | string };
  return {
    sourceTable: "ps_customer",
    sourceRowId: row.source_row_id,
    hotelCreatedAt: toIsoDate(row.date_add) ?? new Date().toISOString(),
  };
}

async function insertCustomRawRow(
  source: ReturnType<typeof postgres>,
  name: string,
  email: string,
  input: RegisterInput
): Promise<RegisterResult> {
  const firstSpace = name.indexOf(" ");
  const firstName = truncate(firstSpace > 0 ? name.slice(0, firstSpace) : name, 100);
  const lastName = truncate(firstSpace > 0 ? name.slice(firstSpace + 1) : "", 100);
  const rows = await source`
    INSERT INTO guests_raw (
      raw_first_name, raw_last_name, raw_email, raw_phone,
      raw_room_type, raw_check_in, raw_check_out, created_at
    ) VALUES (
      ${firstName}, ${lastName}, ${truncate(email, 255)}, ${normalizePhone(input.phone)},
      ${input.room ?? null}, ${input.checkIn ?? null}, ${input.checkOut ?? null}, NOW()
    )
    RETURNING id::text AS source_row_id, created_at
  `;
  const row = rows[0] as { source_row_id: string; created_at: Date | string };
  return {
    sourceTable: "guests_raw",
    sourceRowId: row.source_row_id,
    hotelCreatedAt: toIsoDate(row.created_at) ?? new Date().toISOString(),
  };
}

function cleanName(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s.slice(0, 32) : null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toLowerCase();
  return s.length > 0 ? s : null;
}

function normalizePhone(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function toIsoDate(value: Date | string | null): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

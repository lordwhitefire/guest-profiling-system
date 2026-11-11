// =============================================================================
// Guests repository — DB queries
// =============================================================================
// All guest-related database reads and writes. Uses postgres.js with
// snake_case column names (matches the actual DB schema); the repo
// converts to camelCase on the way out.

import type { Db } from "@gps/shared";
import type {
  Guest,
  Reservation,
  LoyaltyProfile,
  GuestPhase,
  CommPrefs,
} from "@gps/shared";
import type { CreateGuestRequest, UpdateGuestRequest } from "@gps/shared";
import { derivePhase } from "./phase-derivation";

// ── Row types (what postgres.js returns; snake_case) ───────────────────────

interface GuestRow {
  guest_id: string;
  tenant_id: string;
  source_ref: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  date_of_birth: Date | null;
  nationality: string | null;
  language: string;
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  address_line4: string | null;
  city: string | null;
  state: string | null;
  province: string | null;
  county: string | null;
  postal_code: string | null;
  country: string | null;
  preferences: Record<string, unknown>;
  comm_prefs: CommPrefsRow;
  vip_level: string;
  total_stays: number;
  total_spend: string | number;
  last_stay_date: Date | null;
  tags: string[] | null;
  merged_from_ids: string[] | null;
  guest_phase: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface CommPrefsRow {
  email_opt_in: boolean;
  sms_opt_in: boolean;
  push_opt_in: boolean;
  marketing_opt_in: boolean;
}

interface ReservationRow {
  reservation_id: string;
  guest_id: string;
  tenant_id: string;
  source_ref: string | null;
  check_in: Date;
  check_out: Date;
  room_type: string | null;
  status: string;
  num_guests: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface LoyaltyRow {
  loyalty_id: string;
  guest_id: string;
  tenant_id: string;
  tier: string;
  points_balance: number;
  total_stays: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// ── Row → domain object mappers ─────────────────────────────────────────────

function rowToGuest(row: GuestRow, reservations: Reservation[] = []): Guest {
  const derivedPhase = derivePhase(reservations) as GuestPhase;
  const commPrefs: CommPrefs = {
    emailOptIn: row.comm_prefs?.email_opt_in ?? false,
    smsOptIn: row.comm_prefs?.sms_opt_in ?? false,
    pushOptIn: row.comm_prefs?.push_opt_in ?? false,
    marketingOptIn: row.comm_prefs?.marketing_opt_in ?? false,
  };
  return {
    guestId: row.guest_id,
    tenantId: row.tenant_id,
    sourceRef: row.source_ref,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    emailVerified: row.email_verified,
    phone: row.phone,
    phoneVerified: row.phone_verified,
    dateOfBirth: row.date_of_birth,
    nationality: row.nationality,
    language: row.language,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    addressLine3: row.address_line3,
    addressLine4: row.address_line4,
    city: row.city,
    state: row.state,
    province: row.province,
    county: row.county,
    postalCode: row.postal_code,
    country: row.country,
    preferences: row.preferences ?? {},
    commPrefs,
    vipLevel: row.vip_level as Guest["vipLevel"],
    totalStays: row.total_stays,
    totalSpend:
      typeof row.total_spend === "string" ? Number(row.total_spend) : row.total_spend,
    lastStayDate: row.last_stay_date,
    tags: row.tags,
    mergedFromIds: row.merged_from_ids,
    guestPhase: derivedPhase,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function rowToReservation(row: ReservationRow): Reservation {
  return {
    reservationId: row.reservation_id,
    guestId: row.guest_id,
    tenantId: row.tenant_id,
    sourceRef: row.source_ref,
    checkIn: row.check_in,
    checkOut: row.check_out,
    roomType: row.room_type,
    status: row.status as Reservation["status"],
    numGuests: row.num_guests,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function rowToLoyalty(row: LoyaltyRow): LoyaltyProfile {
  return {
    loyaltyId: row.loyalty_id,
    guestId: row.guest_id,
    tenantId: row.tenant_id,
    tier: row.tier as LoyaltyProfile["tier"],
    pointsBalance: row.points_balance,
    totalStays: row.total_stays,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// ── Repository ────────────────────────────────────────────────────────────

export class GuestsRepository {
  constructor(private db: Db) {}

  // ── Reads ────────────────────────────────────────────────────────────────

  async getById(guestId: string, tenantId: string): Promise<Guest | null> {
    const rows = await this.db`
      SELECT * FROM guests
      WHERE guest_id = ${guestId}
        AND tenant_id = ${tenantId}
        AND deleted_at IS NULL
    `;
    if (rows.length === 0) return null;
    const row = rows[0] as unknown as GuestRow;
    const reservations = await this.getReservationsForGuest(guestId);
    return rowToGuest(row, reservations);
  }

  async getReservationsForGuest(
    guestId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ): Promise<Reservation[]> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const offset = (page - 1) * limit;
    const status = options.status?.toUpperCase();

    const rows = status
      ? await this.db`
          SELECT * FROM reservations
          WHERE guest_id = ${guestId}
            AND deleted_at IS NULL
            AND status = ${status}
          ORDER BY check_in DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await this.db`
          SELECT * FROM reservations
          WHERE guest_id = ${guestId}
            AND deleted_at IS NULL
          ORDER BY check_in DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
    return (rows as unknown[] as ReservationRow[]).map(rowToReservation);
  }

  async getLoyaltyForGuest(guestId: string): Promise<LoyaltyProfile | null> {
    const rows = await this.db`
      SELECT * FROM loyalty_profiles
      WHERE guest_id = ${guestId}
        AND deleted_at IS NULL
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const row = rows[0] as unknown as LoyaltyRow;
    return rowToLoyalty(row);
  }

  async list(
    tenantId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{ guests: Guest[]; total: number }> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const [countRows, guestRows] = await Promise.all([
      this.db`SELECT count(*)::int as total FROM guests WHERE tenant_id = ${tenantId} AND deleted_at IS NULL`,
      this.db`
        SELECT * FROM guests
        WHERE tenant_id = ${tenantId}
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = (countRows[0] as unknown as { total: number }).total;
    const guests = (guestRows as unknown[] as GuestRow[]).map((r) => rowToGuest(r));
    return { guests, total };
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async search(tenantId: string, searchTerm: string): Promise<Guest[]> {
    const { buildSearchSql } = await import("./search-ranking");
    const built = buildSearchSql(tenantId, searchTerm);
    if (built === null) return [];

    // Use unsafe() with parameter binding — the SQL string contains dynamic
    // structure (UNION ALL) but user input is bound via $1, $2, etc.
    // Cast params to any[] to bypass postgres.js's strict ParameterOrJSON
    // type (the params are validated at runtime, not at compile time).
    const rows = await this.db.unsafe(built.sql, built.params as never[]);
    return (rows as unknown[] as GuestRow[]).map((r) => rowToGuest(r));
  }

  // ── Writes ──────────────────────────────────────────────────────────────

  async create(tenantId: string, input: CreateGuestRequest): Promise<Guest> {
    const commPrefs: CommPrefsRow = {
      email_opt_in: input.commPrefs?.emailOptIn ?? true,
      sms_opt_in: input.commPrefs?.smsOptIn ?? false,
      push_opt_in: input.commPrefs?.pushOptIn ?? false,
      marketing_opt_in: input.commPrefs?.marketingOptIn ?? false,
    };

    const rows = await this.db`
      INSERT INTO guests
        (tenant_id, first_name, last_name, email, phone, date_of_birth,
         preferences, comm_prefs)
      VALUES
        (${tenantId}, ${input.firstName}, ${input.lastName}, ${input.email},
         ${input.phone ?? null}, ${input.dateOfBirth ? new Date(input.dateOfBirth) : null},
         ${JSON.stringify(input.preferences ?? {})}::jsonb,
         ${JSON.stringify(commPrefs)}::jsonb)
      RETURNING *
    `;
    const row = rows[0] as unknown as GuestRow;
    return rowToGuest(row);
  }

  async update(
    guestId: string,
    tenantId: string,
    input: UpdateGuestRequest,
  ): Promise<Guest | null> {
    // Build a dynamic UPDATE — only set the fields that are provided.
    const sets: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    const addSet = (col: string, value: unknown) => {
      sets.push(`${col} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    };

    if (input.firstName !== undefined) addSet("first_name", input.firstName);
    if (input.lastName !== undefined) addSet("last_name", input.lastName);
    if (input.email !== undefined)
      addSet("email", input.email.toLowerCase().trim());
    if (input.phone !== undefined) addSet("phone", input.phone);
    if (input.dateOfBirth !== undefined)
      addSet(
        "date_of_birth",
        input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      );
    if (input.preferences !== undefined)
      addSet("preferences", JSON.stringify(input.preferences));
    if (input.commPrefs !== undefined)
      addSet("comm_prefs", JSON.stringify(input.commPrefs));

    if (sets.length === 0) {
      // Nothing to update — return the current state.
      return this.getById(guestId, tenantId);
    }

    // Add the tenant_id and guest_id conditions.
    // updated_at is auto-maintained by the trigger.
    params.push(tenantId, guestId);
    const sql = `
      UPDATE guests
      SET ${sets.join(", ")}
      WHERE tenant_id = $${paramIdx}
        AND guest_id = $${paramIdx + 1}
        AND deleted_at IS NULL
      RETURNING *
    `;
    const rows = await this.db.unsafe(sql, params as never[]);
    if (rows.length === 0) return null;
    const row = rows[0] as unknown as GuestRow;
    const reservations = await this.getReservationsForGuest(guestId);
    return rowToGuest(row, reservations);
  }
}

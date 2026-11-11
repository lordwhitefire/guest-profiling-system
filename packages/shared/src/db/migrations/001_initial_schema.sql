-- =============================================================================
-- 001_initial_schema.sql
-- Guest Profiling System — initial schema migration
-- =============================================================================
-- Source: PM Plan Section 14.3 (Data layer)
-- Spec cards referenced:
--   Card 2 (AWS Sample Hospitality — guests table schema)
--   Card 3 (KevAlien CRM — 12-phase guest lifecycle enum)
--   Card 1 (SSLR — sync_state table shape)
--   Card 4 (QloApps — messy source shape, mirrored via source_ref column)
-- =============================================================================

-- pg_trgm extension — required for trigram indexes on guests(email/firstname/lastname)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- Shared trigger function — maintains updated_at on every domain table
-- Per Card 2's pattern (BEFORE UPDATE trigger on guests)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. tenants — one row per hotel install
-- =============================================================================
CREATE TABLE tenants (
    tenant_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ  NULL
);

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. users — receptionist + admin accounts
-- =============================================================================
CREATE TABLE users (
    user_id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID         NOT NULL REFERENCES tenants(tenant_id),
    email          VARCHAR(255) NOT NULL,
    password_hash  TEXT         NOT NULL,
    groups         TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
    -- groups: 'Admin' (chain-level), 'RegionalManager', 'Receptionist'
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ  NULL,
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_email ON users (tenant_id, email);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. guests — the hub table
-- Schema from Card 2 (AWS Sample Hospitality) with Card 3 (KevAlien) phase enum,
-- plus our additions: tenant_id, source_ref, deleted_at
-- =============================================================================
CREATE TABLE guests (
    guest_id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID         NOT NULL REFERENCES tenants(tenant_id),
    source_ref        VARCHAR(255) NULL,
    -- source_ref: the source PMS's id for this guest (e.g., QloApps id_customer as string)
    -- NULL for guests created directly in our system (not yet — all guests come from sync in v1)
    first_name        VARCHAR(32)  NULL,
    -- VARCHAR(32) per QloApps schema (Card 4); application enforces same limit on ingress
    last_name         VARCHAR(32)  NULL,
    email             VARCHAR(128) NULL,
    email_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    phone             VARCHAR(32)  NULL,
    -- phone stored as E.164 normalized; application normalizes on ingress
    phone_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    date_of_birth     DATE         NULL,
    -- QloApps may store 0000-00-00; application treats as NULL on ingress
    nationality       VARCHAR(2)   NULL,
    -- ISO 3166-1 alpha-2 country code
    language          VARCHAR(2)   NOT NULL DEFAULT 'en',
    -- ISO 639-1 language code

    -- Address (region-aware, per Card 2)
    address_line1     VARCHAR(255) NULL,
    address_line2     VARCHAR(255) NULL,
    address_line3     VARCHAR(255) NULL,
    address_line4     VARCHAR(255) NULL,
    city              VARCHAR(255) NULL,
    state             VARCHAR(255) NULL,
    province          VARCHAR(255) NULL,
    county            VARCHAR(255) NULL,
    postal_code       VARCHAR(32)  NULL,
    country           VARCHAR(2)   NULL,

    -- Preferences and consent (JSONB per Card 2)
    preferences       JSONB        NOT NULL DEFAULT '{}'::JSONB,
    comm_prefs        JSONB        NOT NULL DEFAULT '{"email_opt_in": true, "sms_opt_in": false, "push_opt_in": false, "marketing_opt_in": false}'::JSONB,

    -- Loyalty linkage (denormalized for fast display; per Card 2)
    vip_level         VARCHAR(16)  NOT NULL DEFAULT 'NONE'
                      CHECK (vip_level IN ('NONE', 'SILVER', 'GOLD', 'PLATINUM')),
    total_stays       INTEGER      NOT NULL DEFAULT 0,
    total_spend       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    last_stay_date    DATE         NULL,

    -- Tags and provenance (per Card 2)
    tags              TEXT[]        NULL,
    merged_from_ids   UUID[]        NULL,

    -- Phase (Card 3's 12-phase enum; computed on read in v1, stored for fast filter later)
    guest_phase       VARCHAR(32)  NOT NULL DEFAULT 'UNKNOWN_CONTACT'
                      CHECK (guest_phase IN (
                          'UNKNOWN_CONTACT', 'ACQUIRING', 'BOOKING_RECEIVED',
                          'WELCOME_SENT', 'INFO_SENT', 'IDLE', 'UPSELL',
                          'PRE_CHECKIN', 'CHECKIN_DAY', 'IN_HOUSE', 'POST_STAY',
                          'ESCALATED'
                      )),

    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ  NULL,

    -- Email uniqueness per tenant (not global) — multiple tenants may have the same email
    UNIQUE (tenant_id, email)
);

CREATE INDEX idx_guests_tenant_active ON guests (tenant_id, deleted_at);
CREATE INDEX idx_guests_phone ON guests (phone);
-- Trigram indexes for live search (pg_trgm)
CREATE INDEX idx_guests_email_trgm ON guests USING GIN (email gin_trgm_ops);
CREATE INDEX idx_guests_first_name_trgm ON guests USING GIN (first_name gin_trgm_ops);
CREATE INDEX idx_guests_last_name_trgm ON guests USING GIN (last_name gin_trgm_ops);
-- Case-insensitive expression indexes. The search SQL matches on lower(...)
-- for all tiers (including the tier-5 fuzzy `%` match), so these are the
-- indexes Postgres can actually use.
CREATE INDEX idx_guests_email_lower_trgm ON guests USING GIN (lower(email) gin_trgm_ops);
CREATE INDEX idx_guests_first_name_lower_trgm ON guests USING GIN (lower(first_name) gin_trgm_ops);
CREATE INDEX idx_guests_last_name_lower_trgm ON guests USING GIN (lower(last_name) gin_trgm_ops);

CREATE TRIGGER trg_guests_updated_at
    BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. reservations — linked spoke (per Card 2 pattern)
-- =============================================================================
CREATE TABLE reservations (
    reservation_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id          UUID         NOT NULL REFERENCES guests(guest_id),
    tenant_id         UUID         NOT NULL REFERENCES tenants(tenant_id),
    source_ref        VARCHAR(255) NULL,
    -- source_ref: the source PMS's reservation id (string)
    check_in          DATE         NOT NULL,
    check_out         DATE         NOT NULL,
    room_type          VARCHAR(64)  NULL,
    status            VARCHAR(32)  NOT NULL DEFAULT 'CONFIRMED'
                      CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW')),
    num_guests        INTEGER      NOT NULL DEFAULT 1,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ  NULL
);

CREATE INDEX idx_reservations_guest_checkin ON reservations (guest_id, check_in DESC);
CREATE INDEX idx_reservations_tenant ON reservations (tenant_id);

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. guest_identity_documents — linked spoke (sensitive — encrypted at rest)
-- =============================================================================
CREATE TABLE guest_identity_documents (
    document_id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id          UUID         NOT NULL REFERENCES guests(guest_id),
    tenant_id         UUID         NOT NULL REFERENCES tenants(tenant_id),
    type              VARCHAR(32)  NOT NULL
                      CHECK (type IN ('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'OTHER')),
    document_number   BYTEA        NOT NULL,
    -- BYTEA: encrypted at rest via pgcrypto with key from FIELD_ENCRYPTION_KEY env var
    -- These columns are NEVER returned by GET /guests/{id} (Card 2 sensitive-field stripping)
    expiry_date       DATE         NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ  NULL
);

CREATE INDEX idx_guest_identity_documents_guest ON guest_identity_documents (guest_id);

CREATE TRIGGER trg_guest_identity_documents_updated_at
    BEFORE UPDATE ON guest_identity_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. loyalty_profiles — linked spoke (per Card 2 pattern)
-- =============================================================================
CREATE TABLE loyalty_profiles (
    loyalty_id        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id          UUID         NOT NULL REFERENCES guests(guest_id),
    tenant_id         UUID         NOT NULL REFERENCES tenants(tenant_id),
    tier              VARCHAR(16)  NOT NULL DEFAULT 'NONE'
                      CHECK (tier IN ('NONE', 'SILVER', 'GOLD', 'PLATINUM')),
    points_balance    INTEGER      NOT NULL DEFAULT 0,
    total_stays       INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ  NULL
);

CREATE INDEX idx_loyalty_profiles_guest ON loyalty_profiles (guest_id);

CREATE TRIGGER trg_loyalty_profiles_updated_at
    BEFORE UPDATE ON loyalty_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. audit_logs — append-only; NO deleted_at column; NO UPDATE/DELETE triggers
-- =============================================================================
CREATE TABLE audit_logs (
    log_id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID         NOT NULL REFERENCES tenants(tenant_id),
    actor_user_id     UUID         NULL REFERENCES users(user_id),
    -- NULL for system-generated events (e.g., sync job)
    action            VARCHAR(32)  NOT NULL
                      CHECK (action IN ('READ', 'CREATE', 'UPDATE', 'DELETE', 'DSR_EXPORT', 'DSR_DELETE', 'SYNC')),
    entity_type       VARCHAR(64)  NOT NULL,
    -- e.g., 'guest', 'reservation', 'user', 'tenant', 'adapter_connection'
    entity_id         UUID         NULL,
    -- NULL for collection-level actions (e.g., list exports)
    before            JSONB        NULL,
    after             JSONB        NULL,
    -- before/after: JSON snapshots for UPDATE; full snapshot for CREATE; NULL for READ/SYNC
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_created ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- NOTE: No updated_at trigger — audit_logs is append-only.
-- Application must never UPDATE or DELETE from this table.
-- Hard-delete (for retention window compliance) is via a separate manual SQL job, documented in docs/runbook/dsr-handling.md

-- =============================================================================
-- 8. sync_state — per-table replication cursor (Card 1's __sslr_state equivalent)
-- =============================================================================
CREATE TABLE sync_state (
    tenant_id         UUID         NOT NULL REFERENCES tenants(tenant_id),
    table_name        VARCHAR(255) NOT NULL,
    -- table_name is the source PMS's table name, not ours (e.g., 'ps_customer' for QloApps)
    last_seen_xmin    BIGINT       NOT NULL DEFAULT 0,
    -- xmin cursor from the source PMS (Card 1 contract)
    -- TODO(TASK-002): handle xmin wrapping (Card 1 known issue)
    where_clause      TEXT         NULL,
    -- per-table filter (Card 1's filteredTables feature)
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, table_name)
);

CREATE INDEX idx_sync_state_tenant ON sync_state (tenant_id);

CREATE TRIGGER trg_sync_state_updated_at
    BEFORE UPDATE ON sync_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. adapter_connections — per-tenant source PMS connection config
-- =============================================================================
CREATE TABLE adapter_connections (
    connection_id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID         NOT NULL REFERENCES tenants(tenant_id),
    pms_type                VARCHAR(32)  NOT NULL
                            CHECK (pms_type IN ('qloapps', 'mews', 'cloudbeds', 'apaleo', 'custom')),
    connection_url_encrypted BYTEA        NOT NULL,
    -- BYTEA: encrypted at rest via pgcrypto with key from FIELD_ENCRYPTION_KEY env var
    -- The decrypted URL MUST include default_transaction_read_only=true (Card 1 contract)
    is_read_only            BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Always TRUE in v1; column exists for future schema-driven validations
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ  NULL
);

CREATE INDEX idx_adapter_connections_tenant ON adapter_connections (tenant_id);

CREATE TRIGGER trg_adapter_connections_updated_at
    BEFORE UPDATE ON adapter_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Done. 9 domain tables + 1 trigger function + 7 triggers + 11 indexes + 1 extension.
-- Schema matches PM Plan Section 14.3 Table 14.
-- =============================================================================

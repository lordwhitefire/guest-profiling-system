-- =============================================================================
-- 002_task009_two_hotels_and_raw_links.sql
-- TASK-009: two-hotel foundation + real registration loop
-- =============================================================================
-- Adds:
--   1. tenant_memberships  — a user can belong to many tenants (multi-hotel)
--   2. guest_profile_links — links each raw source row to a clean profile
--                           (visit count = COUNT(links); last stay = MAX(source_created_at))
--   3. Seeds a second tenant "Lakeside Suites" + its adapter_connection
--   4. Seeds a tenant_membership so the existing admin user can switch between
--      Grand Vista Hotel and Lakeside Suites.
--
-- Owner directive (2026-11-12): the hotel source DB has NO visit table and NO
-- visit count. Every registration writes one new raw row to the hotel source DB.
-- The visit count is derived in OUR clean DB by grouping the linked raw rows.
-- This migration does NOT add any visit columns or visit tables to a hotel
-- source schema — only to our clean DB, where grouping happens.
-- =============================================================================

-- =============================================================================
-- 1. tenant_memberships — many-to-many between users and tenants
-- =============================================================================
-- A user has one "home tenant" (users.tenant_id) for backwards compatibility,
-- plus zero-or-more memberships. The active tenant is stored in the JWT
-- (tenant_id claim) and is switched via POST /api/auth/switch-tenant.
CREATE TABLE IF NOT EXISTS tenant_memberships (
    membership_id   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(user_id),
    tenant_id       UUID         NOT NULL REFERENCES tenants(tenant_id),
    groups          TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    -- groups within this tenant (may differ from home tenant — e.g. Receptionist
    -- at Grand Vista, Admin at Lakeside Suites)
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  NULL,
    UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user
    ON tenant_memberships (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant
    ON tenant_memberships (tenant_id) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_tenant_memberships_updated_at ON tenant_memberships;
CREATE TRIGGER trg_tenant_memberships_updated_at
    BEFORE UPDATE ON tenant_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 2. guest_profile_links — links a hotel source raw row to a clean profile
-- =============================================================================
-- One row per (tenant_id, source_table, source_row_id) tuple that has been
-- grouped into a clean profile.
--
-- visit count for a clean profile =
--   SELECT COUNT(*) FROM guest_profile_links WHERE guest_id = ?
-- last stay =
--   SELECT MAX(source_created_at) FROM guest_profile_links WHERE guest_id = ?
--
-- Idempotent re-sync: INSERT ... ON CONFLICT (tenant_id, source_table, source_row_id)
-- DO NOTHING — running the adapter twice does not double the count.
CREATE TABLE IF NOT EXISTS guest_profile_links (
    link_id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL REFERENCES tenants(tenant_id),
    guest_id        UUID         NOT NULL REFERENCES guests(guest_id),
    source_table    VARCHAR(255) NOT NULL,
    -- hotel source PMS table name, e.g. 'ps_customer' (QloApps) or 'guests_raw'
    source_row_id   VARCHAR(255) NOT NULL,
    -- the source PMS's primary key, as a string (QloApps id_customer, etc.)
    source_created_at TIMESTAMPTZ NULL,
    -- the raw row's created_at in the hotel source DB — used for "last stay"
    -- derivation. NULL if the source row has no created_at.
    source_payload  JSONB        NULL,
    -- full snapshot of the source row at link time, for audit / re-grouping
    linked_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    linked_by_job   VARCHAR(64)  NULL,
    -- which adapter run created this link (e.g. 'adapter-sync-2026-11-13T...')

    UNIQUE (tenant_id, source_table, source_row_id)
);

CREATE INDEX IF NOT EXISTS idx_guest_profile_links_guest
    ON guest_profile_links (guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_profile_links_tenant
    ON guest_profile_links (tenant_id, source_table);

-- =============================================================================
-- 3. Seed: second tenant "Lakeside Suites" + real memberships
-- =============================================================================
-- The first tenant is the existing "Grand Vista Hotel"
-- (tenant_id 11111111-1111-1111-1111-111111111111 per the existing seed).
-- We add the second tenant with a FIXED uuid so downstream fixtures can
-- reference it deterministically.

INSERT INTO tenants (tenant_id, name)
VALUES ('22222222-2222-2222-2222-222222222222', 'Lakeside Suites')
ON CONFLICT (tenant_id) DO NOTHING;

-- Home membership for every existing user. This is what makes the switcher
-- work for the real seeded accounts (admin@grandvista.test and
-- receptionist@grandvista.test), not for an imaginary account.
INSERT INTO tenant_memberships (user_id, tenant_id, groups)
SELECT u.user_id, u.tenant_id, u.groups
FROM users u
WHERE u.deleted_at IS NULL
ON CONFLICT (user_id, tenant_id) DO UPDATE
SET groups = EXCLUDED.groups,
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW();

-- Hotel admins get membership at the second hotel too. Receptionists stay
-- home-only unless an admin grants them access explicitly.
INSERT INTO tenant_memberships (user_id, tenant_id, groups)
SELECT u.user_id,
       '22222222-2222-2222-2222-222222222222'::uuid,
       u.groups
FROM users u
WHERE u.deleted_at IS NULL
  AND 'Admin' = ANY(u.groups)
ON CONFLICT (user_id, tenant_id) DO UPDATE
SET groups = EXCLUDED.groups,
    is_active = TRUE,
    deleted_at = NULL,
    updated_at = NOW();

-- No adapter connection is seeded. An empty encrypted DSN is not a
-- connection: it makes sync/test select a broken row. A real read-only DSN
-- and a real write DSN are added by an admin through
-- POST /api/adapter/connection after the source database exists.

-- =============================================================================
-- Done. Two hotels exist; the admin can switch between them; the clean DB can
-- derive visit counts from grouped raw rows without touching the hotel schema.
-- =============================================================================

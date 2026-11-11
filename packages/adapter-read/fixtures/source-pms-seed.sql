-- =============================================================================
-- source-pms-seed.sql
-- =============================================================================
-- Creates a fake "source PMS" database schema that mimics QloApps'
-- ps_customer table (Card 4 §6.5 of the Behavioral Specification), and
-- loads the messy-guests.csv fixture data into it.
--
-- This stands in for a real hotel's PMS DB when no real hotel is available.
-- The adapter-read worker treats it as the source — same code path, same
-- SELECT statements, same QloApps mapping. The only thing that's different
-- from a production install is the connection URL.
--
-- USAGE:
--   1. Create an empty Postgres DB for the source PMS:
--        createdb gps_source_pms
--   2. Load this file:
--        psql -d gps_source_pms -f packages/adapter-read/fixtures/source-pms-seed.sql
--      (run from repo root so the relative CSV path resolves, or edit the
--       COPY FROM path to be absolute)
--   3. Add an adapter_connections row that points at this DB (see
--      docs/runbook/demo-end-to-end.md).
--
-- NOTES:
--   - Column types match QloApps' PrestaShop-derived schema (Card 4).
--     Postgres has no TINYINT(1) — we use SMALLINT with a CHECK (0 or 1).
--   - The forbidden columns (passwd, secure_key, etc.) are deliberately
--     ABSENT. QloApps has them; we don't even create them in the fixture
--     because the adapter never reads them (qloapps.ts ALLOWED_COLUMNS).
--   - The fixture data has every Card 4 edge case: zero-date birthdays,
--     mixed-case emails, weird phone formats, soft-deleted rows, long
--     names that exceed VARCHAR(32), NULL emails, whitespace-only emails,
--     and duplicate-looking rows.
-- =============================================================================

-- Drop existing to make the script idempotent
DROP TABLE IF EXISTS ps_customer;

CREATE TABLE ps_customer (
    id_customer    SERIAL         PRIMARY KEY,
    firstname      VARCHAR(32)    NOT NULL,
    lastname       VARCHAR(32)    NOT NULL,
    email          VARCHAR(128)   NOT NULL,
    phone          VARCHAR(32)    NULL,
    birthday       DATE           NULL,
    newsletter     SMALLINT       NOT NULL DEFAULT 0 CHECK (newsletter IN (0, 1)),
    optin          SMALLINT       NOT NULL DEFAULT 0 CHECK (optin IN (0, 1)),
    deleted        SMALLINT       NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
    date_add       TIMESTAMP      NOT NULL,
    date_upd       TIMESTAMP      NOT NULL
);

-- IMPORTANT: this path is relative to where psql is invoked from.
-- Recommended: invoke psql from the repo root.
-- If that doesn't work, edit the path below to be absolute.
\copy ps_customer (id_customer, firstname, lastname, email, phone, birthday, newsletter, optin, deleted, date_add, date_upd)
    FROM 'packages/adapter-read/fixtures/messy-guests.csv'
    WITH (FORMAT csv, HEADER true, NULL '');

-- Verify
SELECT 'ps_customer row count: ' || count(*) AS info FROM ps_customer;
SELECT 'ps_customer sample (first 5):' AS info;
SELECT id_customer, firstname, lastname, email, phone, birthday,
       newsletter, optin, deleted, date_add, date_upd
FROM ps_customer ORDER BY id_customer LIMIT 5;

-- Sanity-check edge cases are present
SELECT '--- edge case sanity ---' AS info;
SELECT 'zero-date birthdays: ' || count(*) AS info FROM ps_customer WHERE birthday = '0000-00-00'::date;
SELECT 'soft-deleted rows: '   || count(*) AS info FROM ps_customer WHERE deleted = 1;
SELECT 'null emails: '         || count(*) AS info FROM ps_customer WHERE email IS NULL OR trim(email) = '';
SELECT 'long first names > 32: ' || count(*) AS info FROM ps_customer WHERE length(firstname) > 32;
SELECT 'long last names > 32: '  || count(*) AS info FROM ps_customer WHERE length(lastname) > 32;
SELECT 'duplicate emails (same email, different id): ' || count(*) AS info
FROM (SELECT email FROM ps_customer WHERE email IS NOT NULL AND trim(email) <> '' GROUP BY email HAVING count(*) > 1) d;

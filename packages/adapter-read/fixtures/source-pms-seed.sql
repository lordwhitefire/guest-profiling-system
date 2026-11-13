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

-- Load through a text staging table: the CSV deliberately contains messy
-- values (empty names, zero-dates, >32-char names) that a strict COPY into
-- the typed table would reject. The transform below keeps the mess — empty
-- strings stay empty, zero-dates become NULL, long names truncate to the
-- QloApps column width — so the adapter sees what a real PMS would give it.
DROP TABLE IF EXISTS ps_customer_staging;
CREATE TEMP TABLE ps_customer_staging (
    id_customer text, firstname text, lastname text, email text, phone text,
    birthday text, newsletter text, optin text, deleted text, date_add text, date_upd text
);

\copy ps_customer_staging FROM 'packages/adapter-read/fixtures/messy-guests.csv' WITH (FORMAT csv, HEADER true, NULL '\N')

INSERT INTO ps_customer (id_customer, firstname, lastname, email, phone, birthday,
                         newsletter, optin, deleted, date_add, date_upd)
SELECT
    NULLIF(trim(id_customer), '')::int,
    left(coalesce(nullif(trim(firstname), ''), ''), 32),
    left(coalesce(nullif(trim(lastname), ''), ''), 32),
    coalesce(nullif(trim(email), ''), ''),
    NULLIF(trim(phone), ''),
    CASE WHEN birthday IS NULL OR trim(birthday) = '' OR birthday LIKE '0000%'
         THEN NULL ELSE birthday::date END,
    coalesce(NULLIF(trim(newsletter), ''), '0')::int,
    coalesce(NULLIF(trim(optin), ''), '0')::int,
    coalesce(NULLIF(trim(deleted), ''), '0')::int,
    coalesce(NULLIF(trim(date_add), '')::timestamp, now()),
    coalesce(NULLIF(trim(date_upd), '')::timestamp, now())
FROM ps_customer_staging;

-- The fixture inserts explicit id_customer values; move the sequence past
-- them or the first registration will collide with ps_customer_pkey.
SELECT setval('ps_customer_id_customer_seq', (SELECT MAX(id_customer) FROM ps_customer));

-- Verify
SELECT 'ps_customer row count: ' || count(*) AS info FROM ps_customer;
SELECT 'ps_customer sample (first 5):' AS info;
SELECT id_customer, firstname, lastname, email, phone, birthday,
       newsletter, optin, deleted, date_add, date_upd
FROM ps_customer ORDER BY id_customer LIMIT 5;

-- Sanity-check edge cases are present
SELECT '--- edge case sanity ---' AS info;
SELECT 'zero-date birthdays (stored as NULL): ' || count(*) AS info FROM ps_customer WHERE birthday IS NULL;
SELECT 'soft-deleted rows: '   || count(*) AS info FROM ps_customer WHERE deleted = 1;
SELECT 'empty emails: '         || count(*) AS info FROM ps_customer WHERE email = '';
SELECT 'long first names > 32: ' || count(*) AS info FROM ps_customer WHERE length(firstname) > 32;
SELECT 'long last names > 32: '  || count(*) AS info FROM ps_customer WHERE length(lastname) > 32;
SELECT 'duplicate emails (same email, different id): ' || count(*) AS info
FROM (SELECT email FROM ps_customer WHERE email IS NOT NULL AND trim(email) <> '' GROUP BY email HAVING count(*) > 1) d;

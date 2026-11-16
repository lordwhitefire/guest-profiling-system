-- =============================================================================
-- 004_fix_double_encoded_jsonb.sql
-- =============================================================================
-- Repairs rows written by earlier versions of the sync code that used
-- `${JSON.stringify(value)}::jsonb`. postgres.js already JSON-encodes object
-- parameters, so those writes stored a JSON string (e.g. "{}" as a string)
-- instead of a JSON object.
--
-- The application code now passes the object directly. This migration repairs
-- existing clean-DB rows; it does not touch any hotel source database.
-- =============================================================================

UPDATE guests
SET preferences = (preferences #>> '{}')::jsonb
WHERE jsonb_typeof(preferences) = 'string';

UPDATE guests
SET comm_prefs = (comm_prefs #>> '{}')::jsonb
WHERE jsonb_typeof(comm_prefs) = 'string';
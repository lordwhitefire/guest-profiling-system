-- =============================================================================
-- 003_repair_tenant_settings.sql
-- Repair tenant settings rows written by an earlier broken serialisation path.
-- Some rows held a JSON string or an object with numeric character keys instead
-- of the settings object. The API now sanitises reads and writes; this clears
-- only the corrupt shapes so defaults apply. No schema change.
-- =============================================================================

UPDATE tenants
SET settings = '{}'::jsonb
WHERE settings IS NULL
   OR jsonb_typeof(settings) <> 'object'
   OR settings ? '0';

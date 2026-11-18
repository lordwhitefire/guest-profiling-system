-- =============================================================================
-- 005_add_tenants_settings.sql
-- =============================================================================
-- 001_initial_schema.sql originally shipped without tenants.settings, yet
-- 003_repair_tenant_settings.sql updated it. Existing databases (including the
-- local dev DB) had the column added by hand, so the gap was invisible.
--
-- 001 now declares the column for fresh installs. This migration covers
-- databases created before that fix, and is a safe no-op when it already exists.
-- =============================================================================

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
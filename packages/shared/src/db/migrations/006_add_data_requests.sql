-- =============================================================================
-- 006_add_data_requests.sql
-- =============================================================================
-- 001_initial_schema.sql never created `data_requests`, even though the app
-- exposes /api/data-requests (DSR workflow). The local dev DB had the table
-- added by hand, so the gap was invisible until a fresh database was built.
--
-- This migration makes a fresh install match the application.
-- =============================================================================

CREATE TABLE IF NOT EXISTS data_requests (
    request_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(tenant_id),
    guest_id      UUID REFERENCES guests(guest_id),
    guest_email   VARCHAR(255),
    type          VARCHAR(32) NOT NULL
                  CHECK (type IN ('ACCESS', 'EXPORT', 'CORRECTION', 'DELETION')),
    status        VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED'
                  CHECK (status IN ('SUBMITTED', 'REVIEWING', 'FULFILLED', 'REJECTED')),
    description   TEXT,
    submitted_by  UUID NOT NULL REFERENCES users(user_id),
    submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by   UUID REFERENCES users(user_id),
    reviewed_at   TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_requests_tenant
  ON data_requests (tenant_id);

CREATE INDEX IF NOT EXISTS idx_data_requests_status
  ON data_requests (status);
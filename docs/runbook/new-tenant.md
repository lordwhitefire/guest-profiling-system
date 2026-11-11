# Runbook — Adding a New Tenant

**Status**: stub. Full procedure to be documented in TASK-005.

## Summary

For a new hotel install, the maintainer creates a new tenant via the admin UI at `/admin/tenants`. This generates:

1. A new row in the `tenants` table with a fresh `tenant_id` (UUID)
2. An `adapter_connections` row linking the tenant to the hotel's PMS connection URL (encrypted at rest)
3. An admin user account in the `users` table for the hotel's receptionist manager
4. The first sync job run for the new tenant

The new tenant's install gets its own `DEFAULT_TENANT_ID` env var (per-hotel deploy).

## TODO

- [ ] Exact CLI commands for the maintainer (alternative to admin UI)
- [ ] What information the hotel must provide before tenant creation (read-only DB credentials, PMS vendor name, PMS version)
- [ ] First-run verification (sync completes, profiles appear in search)
- [ ] Handoff to the hotel (admin credentials, runbook pointer)

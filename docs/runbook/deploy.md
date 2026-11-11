# Runbook — Deploy

**Status**: stub. Full procedure to be documented before first production deploy.

## Summary

Deploy the Guest Profiling System to a PaaS (Render / Fly.io / Railway — TBD by owner).

The deploy unit is the `packages/core` Next.js app. The `packages/adapter-read` worker runs as a separate process on the same PaaS (most PaaS support worker processes alongside web services).

## TODO

- [ ] PaaS-specific deploy commands (pending owner's hosting choice)
- [ ] Database provisioning steps
- [ ] Environment variable configuration
- [ ] First-run setup (create tenant, create admin user, configure adapter connection)
- [ ] Post-deploy smoke test
- [ ] Rollback procedure

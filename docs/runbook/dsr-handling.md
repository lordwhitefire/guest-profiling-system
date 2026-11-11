# Runbook — Data Subject Request (DSR) Handling

**Status**: stub. Full procedure to be documented in TASK-005.

## Summary

A data subject (hotel guest) can exercise their rights under NDPR (Nigeria), GDPR (EU), or CCPA (US) by submitting a request to the hotel. The hotel forwards the request to the system maintainer. The maintainer uses the admin UI at `/admin/dsr` to:

1. **Export** — assemble a JSON of all the guest's data (profile, reservations, loyalty, audit log entries for that guest). Delivered to the guest within 30 days per regulation.
2. **Delete** — set the guest's `deleted_at` timestamp. The guest's data is no longer returned by any query. After the legal retention window (default 7 years), a manual hard-delete job purges the row.

## TODO

- [ ] Exact JSON shape of the export
- [ ] Identity verification flow (how to confirm the requester is the data subject)
- [ ] Logging requirements (audit_logs entry for every DSR action)
- [ ] Timeline expectations (30 days for export per GDPR; "without undue delay" for deletion)
- [ ] What to do if the guest has active reservations (deletion may need to wait until check-out)

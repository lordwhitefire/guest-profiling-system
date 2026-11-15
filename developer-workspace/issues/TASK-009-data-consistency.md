# Issue — Data-layer consistency: same guest shows different visit counts

**Status:** Open
**Severity:** High — demo-blocking
**Found:** 2026-11-15
**Related:** TASK-009, `developer-workspace/reports/TASK-009-status-2026-11-13.md`

## What happens

The same guest name can show different visit counts in different screens.

Example: **Zainab Wang**

- The list shows **3 visits** (Grand Vista).
- The profile page shows **1 visit** (Lakeside profile, or a stale/cached record).

The database itself is not ambiguous:

| Tenant | Guest ID | `total_stays` | Linked source rows |
|---|---|---:|---|
| Grand Vista | `b143296f-f7e2-4b56-b525-578d630f2332` | 3 | 123, 1011, 1012 |
| Lakeside | `528a4388-7971-4c1c-808b-87c956762dc4` | 1 | 123 |

There are no `loyalty_profiles` or `reservations` rows for either profile.

## Root cause

The product has more than one data path for “visits”:

1. `guests.total_stays` — used by the list/profile summary.
2. `guest_profile_links` — used by the Visit History tab.
3. Legacy `reservations` / `loyalty_profiles` — still used by the standalone `/profile/[guestId]` page.

The profile page is not reliably using the same `guest_id` and `tenant_id` as the row the user clicked. It can show the other hotel's profile, a cached object, or a legacy count. This makes the visit count disagree between screens.

This is a **selection/data-path bug**, not a hardcoded number in the list. But it violates the one-source-of-truth rule: every screen must read the clean database for the exact guest and tenant selected.

## Missing checks that allowed this

There is no automated test for data consistency across screens. Also missing:

- Real Postgres integration tests (current tests use pg-mem or hand-written mocks).
- API integration tests for login, tenant switch, registration, sync, and exports.
- The registration → sync → visit-count loop as an automated test.
- End-to-end multi-hotel isolation through the UI/API.
- Extension install → bridge → fill in a real browser (manual only).
- UI flow tests beyond four smoke tests.
- Security, accessibility, performance, visual, and backup/recovery checks.

## Acceptance criteria

1. Every screen that shows a guest uses the same `guest_id` **and** `tenant_id` from the clean database.
2. The profile page fetches by the exact guest ID from the clicked row.
3. Switching hotels clears the selected guest; no stale guest object survives the switch.
4. The visit count is derived from `guest_profile_links` (or `total_stays` recomputed from it) and matches on the list, dashboard, profile, and Visit History.
5. No screen reads `reservations` or `loyalty_profiles` for the visit count.
6. An automated data-consistency test creates two same-name guests in two tenants and asserts each screen shows the correct count.
7. An automated test covers registration → sync → visit count increment for the same email/phone.

## Evidence

```sql
-- Clean DB
select tenant_id, guest_id, email, total_stays
from guests
where lower(email) = 'zwang@proton.me';

-- b143296f... | Grand Vista | total_stays = 3
-- 528a4388... | Lakeside   | total_stays = 1

select guest_id, count(*), string_agg(source_row_id, ',' order by source_row_id)
from guest_profile_links
group by guest_id;

-- b143296f... | 3 | 123,1011,1012
-- 528a4388... | 1 | 123
```

## Decision

Do not fix the UI by guessing. First make the data path explicit: one guest identity (`guest_id` + `tenant_id`), one visit source (`guest_profile_links`), and one count derived from it. Then add the missing consistency tests.
# TASK-003 — Guest Profile API

**Phase**: 1 (Core)
**Status**: in_progress
**Estimated effort**: 1 week single-dev
**Depends on**: TASK-001 (foundation — applied and verified), TASK-002 (adapter-read — provides the data this API serves)

## What this task produces

The Guest Profile API — six endpoints per Behavioral Specification Card 2, plus the live search endpoint (Feature Card F1 from the PM Plan). This is the API the receptionist web UI (TASK-004) and the browser extension form-fill (TASK-006) will call.

After this task: data flows from source PMS → our DB (TASK-002) → served via HTTP to any authorized client.

## Scope

### In scope

1. **Six guest endpoints** per Card 2 §4.2:
   - `POST /api/guests` — create a new guest (CRS audience)
   - `GET /api/guests/{guestId}` — get a guest profile (owner-only; sensitive fields stripped)
   - `PUT /api/guests/{guestId}` — update a guest profile (owner-only)
   - `GET /api/guests/{guestId}/reservations` — linked spoke; paginated; owner-only
   - `GET /api/guests/{guestId}/loyalty` — linked spoke; owner-only
   - `GET /api/guests` — list guests (PMS staff only; tenant-scoped via shared resolver)
2. **Live search endpoint** (Feature F1):
   - `GET /api/guests/search?q=...` — returns up to 20 matching profiles, ranked by exact email > exact phone > prefix name match > substring name match. p95 target < 300ms on 10k guests.
3. **Phase derivation** (Card 3 → `guest_phase` column):
   - Computed on read (not stored). Rules per PM Plan §14.2:
     - Future reservation + check_in <= today+2 → `PRE_CHECKIN`
     - check_in == today → `CHECKIN_DAY`
     - check_in <= today <= check_out → `IN_HOUSE`
     - check_out < today, last 7 days → `POST_STAY`
     - Otherwise → `IDLE`
   - Returns in the GET response as `guest_phase` field.
4. **Sensitive-field stripping** (Card 2 §4.4):
   - `identity_doc_type`, `identity_doc_number`, `identity_doc_expiry` are NEVER returned by `GET /guests/{id}`. They live in the linked `guest_identity_documents` table; only fetched via separate privileged flow (admin-only, TASK-005).
5. **Audit log writes** on every mutation (POST, PUT, DELETE if added later):
   - Append to `audit_logs` table: `actor_user_id`, `action`, `entity_type`, `entity_id`, `before`, `after` JSONB.
   - Never blocks the response (best-effort; failure logged but not propagated).
6. **Standard response envelope** (PM Plan §8.2 — simplified):
   - Success: `{ "success": true, "data": <payload>, "metadata": { "page"?, "limit"?, "total"? } }`
   - Error: `{ "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }`
7. **Pagination** on list and reservations endpoints:
   - `?page=1&limit=20` (defaults); max limit 100.
   - `metadata.total` returned on list endpoints.
8. **Tests** — Vitest unit tests for every endpoint, using seeded fixture data (no real DB needed).

### Out of scope

- Receptionist web UI (TASK-004)
- Admin UI (TASK-005)
- Browser extension (TASK-006)
- DSR (data subject request) endpoints (TASK-005)
- Identity document endpoints beyond the sensitive-field stripping (TASK-005)
- Webhooks (out of scope per PM Plan)
- Real-time features (out of scope per PM Plan)

## Implementation brief

### File layout

```
packages/core/
├── app/api/guests/
│   ├── route.ts                            POST (create) + GET (list)
│   ├── search/route.ts                     GET /search?q=...
│   └── [guestId]/
│       ├── route.ts                        GET (one) + PUT (update)
│       ├── reservations/route.ts            GET /reservations
│       └── loyalty/route.ts                GET /loyalty
├── src/server/
│   ├── guests/
│   │   ├── repository.ts                   DB queries (postgres.js)
│   │   ├── phase-derivation.ts             Card 3 phase rules
│   │   ├── sensitive-fields.ts             strips identity_doc_* on GET
│   │   └── search-ranking.ts               Card 2 ranking rules
│   ├── audit/
│   │   └── log.ts                          append-only audit log writer
│   └── response.ts                         standard envelope helpers
└── __tests__/
    ├── guests-repository.test.ts           DB queries (pg-mem fixture)
    ├── phase-derivation.test.ts            Card 3 rules
    ├── search-ranking.test.ts              ranking + limit 20
    ├── audit-log.test.ts                   append-only behavior
    └── api-guests-endpoints.test.ts        full HTTP integration via Vitest
```

### The six endpoints — request/response shapes

**POST /api/guests** (Card 2 §4.2 — create)
- Auth: Cognito ID token (here: JWT, caller's own sub)
- Body: `{ firstName, lastName, email, phone?, dateOfBirth?, preferences?, commPrefs? }`
- 201 + guest object on success. If guest exists with same `cognito_sub` (here: same `user_id`), backfills empty name fields and returns 200.
- 400 on validation error. 401 unauthenticated. 409 if email already exists in tenant.

**GET /api/guests/{guestId}** (Card 2 §4.2 — get one)
- Auth: JWT, owner-only (caller.sub == guest.user_id, where `user_id` is a separate concept from `guest_id` — guests don't have logins in v1; this check is skipped if the caller is staff with tenant scope).
- 200 + guest object (sensitive fields stripped, phase derived).
- 404 if not found. 403 if not owner or staff.

**PUT /api/guests/{guestId}** (Card 2 §4.2 — update)
- Auth: JWT, owner-only.
- Body: partial guest fields.
- 200 + updated guest object.
- 404 if not found. 403 if not owner.

**GET /api/guests/{guestId}/reservations** (Card 2 §4.2 — linked spoke)
- Auth: JWT, owner-only.
- Query: `?status=&page=&limit=`
- 200 + paginated reservations joined with property_name, ordered by check_in DESC.

**GET /api/guests/{guestId}/loyalty** (Card 2 §4.2 — linked spoke)
- Auth: JWT, owner-only.
- 200 + `{ tier, pointsBalance, totalStays }`.

**GET /api/guests** (Card 2 §4.2 — list)
- Auth: JWT, staff-only (Admin / RegionalManager / Receptionist group).
- Query: `?page=&limit=`
- 200 + paginated guest list, tenant-scoped by caller's JWT per Card 2's `resolve_property_scope` (already in shared/auth).

### Live search endpoint (Feature F1)

**GET /api/guests/search?q=...**
- Auth: JWT, staff-only.
- Query: `q` (the search term); max 100 chars; min 2 chars (otherwise returns empty array).
- Returns: up to 20 matching profiles, ranked by:
  1. Exact email match (case-insensitive)
  2. Exact phone match (digits-only comparison)
  3. Prefix match on `first_name` or `last_name` (case-insensitive)
  4. Substring match on `first_name`, `last_name`, or `email` (case-insensitive; trigram via pg_trgm)
- Indexes (already created in TASK-001): `idx_guests_email_trgm`, `idx_guests_first_name_trgm`, `idx_guests_last_name_trgm` (GIN), `idx_guests_phone` (btree).
- Tenant-scoped via the shared resolver.
- Excludes soft-deleted guests (`deleted_at IS NULL`).
- p95 target: < 300ms on 10k guests in single tenant. (Verification: load test deferred; smoke test in this task.)

### Phase derivation (Card 3 → `guest_phase`)

Per PM Plan §14.2. Computed on read from the guest's reservations; never stored (avoids stale data).

```typescript
function derivePhase(reservations: Reservation[], now: Date): GuestPhase {
  const today = startOfDay(now);
  const activeRes = reservations.filter(r => r.status !== "CANCELLED" && r.status !== "NO_SHOW");

  // Currently in-house?
  const inHouse = activeRes.find(r => startOfDay(r.checkIn) <= today && today <= startOfDay(r.checkOut));
  if (inHouse) return "IN_HOUSE";

  // Check-in today?
  const todayCheckin = activeRes.find(r => startOfDay(r.checkIn).getTime() === today.getTime());
  if (todayCheckin) return "CHECKIN_DAY";

  // Within 48h of check-in?
  const twoDaysFromNow = addDays(today, 2);
  const upcoming = activeRes.find(r => startOfDay(r.checkIn) > today && startOfDay(r.checkIn) <= twoDaysFromNow);
  if (upcoming) return "PRE_CHECKIN";

  // Recently checked out (within 7 days)?
  const sevenDaysAgo = addDays(today, -7);
  const recentCheckout = activeRes.find(r => startOfDay(r.checkOut) < today && startOfDay(r.checkOut) >= sevenDaysAgo);
  if (recentCheckout) return "POST_STAY";

  // Future reservation beyond 2 days?
  const future = activeRes.find(r => startOfDay(r.checkIn) > twoDaysFromNow);
  if (future) return "IDLE";  // Has future booking, but not imminent

  // Has reservations but all in the past beyond 7 days?
  if (activeRes.length > 0) return "IDLE";

  // No reservations at all?
  return "UNKNOWN_CONTACT";
}
```

### Sensitive-field stripping (Card 2 §4.4)

The three columns `identity_doc_type`, `identity_doc_number`, `identity_doc_expiry` live in the `guest_identity_documents` linked table. They are NOT returned by `GET /api/guests/{id}` — the response excludes the entire `identity_documents` array. Fetching identity documents requires a separate admin-only endpoint (TASK-005).

### Audit log writes

On every POST/PUT/DELETE mutation to guest data:

```sql
INSERT INTO audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, before, after)
VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb);
```

- `before` is NULL on POST; `after` is NULL on DELETE.
- Best-effort: if the audit log insert fails, log the error but do NOT fail the request (audit is observability, not transactional correctness).
- The audit_logs table is append-only (no UPDATE/DELETE; enforced by convention in v1, by database role in a future task).

### Response envelope

```typescript
// Success
{ "success": true, "data": <payload>, "metadata": { "page"?, "limit"?, "total"? } }

// Error
{ "success": false, "error": { "code": "...", "message": "...", "details"?: ... } }
```

Helper functions in `src/server/response.ts`:
- `ok<T>(data, metadata?)` → NextResponse 200 with success envelope
- `created<T>(data)` → NextResponse 201
- `badRequest(code, message, details?)` → 400
- `unauthorized(message?)` → 401
- `forbidden(message?)` → 403
- `notFound(message?)` → 404
- `conflict(message)` → 409
- `serverError()` → 500 (logs the actual error; returns generic message)

## Acceptance criteria

1. `pnpm install` succeeds (no new dependencies beyond what TASK-001 added)
2. `pnpm typecheck` passes (no new errors in core)
3. `pnpm test:unit` passes — at least 30 new test cases covering:
   - Repository queries (pg-mem fixture)
   - Phase derivation (all 5 outcomes)
   - Search ranking (4 tiers)
   - Sensitive-field stripping
   - Audit log writes
   - Each endpoint's happy path + auth failures + validation errors
4. `pnpm build` (Next.js) succeeds — all new routes compile
5. The standard response envelope is used on every endpoint (success and error)
6. Tenant scope resolver (Card 2's fail-closed pattern) is invoked on every list endpoint
7. Owner-only access is enforced on GET /guests/{id}, PUT, /reservations, /loyalty
8. Sensitive fields are NEVER returned by GET /guests/{id} (asserted by test)
9. Audit log entries are written on POST and PUT (asserted by test)
10. Search endpoint returns ≤20 results, ranked correctly, excludes soft-deleted guests

## What this task does NOT verify

- p95 latency on 10k guests (load test deferred; smoke test only)
- Real Cognito integration (using JWT with group claims per TASK-001)
- Multi-tenant runtime behavior (single-tenant deploy in v1; resolver is tested in unit tests)
- Consent enforcement on form-fill (deferred to TASK-006)

## Hand-off

When TASK-003 is `done`:

1. Architect verifies against `testing.md`
2. Architect marks `done` in `openspec/tasks-registry.md`
3. Architect updates `PROGRESS.md`
4. TASK-004 (receptionist UI) and TASK-005 (admin UI) become unblocked

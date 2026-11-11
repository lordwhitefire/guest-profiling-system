# TASK-003 — Testing

**Phase**: 1 (Core)
**Status**: ready to verify
**Pairs with**: `task.md` in this folder

## Test categories

### 1. Static checks (CI must pass)

- [ ] `pnpm install` exits 0
- [ ] `pnpm typecheck` exits 0 across all packages (no new errors in core)
- [ ] `pnpm build` (Next.js) succeeds — all new routes compile
- [ ] No `console.log` outside test files
- [ ] No `any` types outside test fixtures
- [ ] No `// TODO` without a linked issue

### 2. Response envelope tests (`__tests__/response.test.ts`)

- [ ] `ok({ foo: "bar" })` returns 200 with `{ success: true, data: { foo: "bar" } }`
- [ ] `ok(items, { page: 1, limit: 20, total: 100 })` includes metadata
- [ ] `created({ id: "x" })` returns 201 with success envelope
- [ ] `badRequest("VALIDATION_ERROR", "Missing email")` returns 400 with error shape
- [ ] `unauthorized()` returns 401 with code "UNAUTHORIZED"
- [ ] `forbidden("Not owner")` returns 403 with code "FORBIDDEN"
- [ ] `notFound()` returns 404 with code "NOT_FOUND"
- [ ] `conflict("Email exists")` returns 409 with code "CONFLICT"
- [ ] `serverError()` returns 500 with code "INTERNAL_ERROR" and generic message (does NOT leak the actual error to the client)

### 3. Phase derivation tests (`__tests__/phase-derivation.test.ts`)

- [ ] No reservations → `UNKNOWN_CONTACT`
- [ ] Reservation with check_in today → `CHECKIN_DAY`
- [ ] Reservation with check_in <= today AND check_out >= today → `IN_HOUSE`
- [ ] Future reservation with check_in within 48h (today+1 or today+2) → `PRE_CHECKIN`
- [ ] Past reservation with check_out within last 7 days → `POST_STAY`
- [ ] Future reservation with check_in beyond 2 days → `IDLE`
- [ ] All reservations in the past beyond 7 days → `IDLE`
- [ ] CANCELLED and NO_SHOW reservations are excluded from derivation
- [ ] Multiple active reservations: the most-current state wins (IN_HOUSE > CHECKIN_DAY > PRE_CHECKIN > POST_STAY > IDLE)

### 4. Search ranking tests (`__tests__/search-ranking.test.ts`)

- [ ] Empty query (q="") returns empty array (does NOT return all guests)
- [ ] Query shorter than 2 chars returns empty array
- [ ] Query longer than 100 chars is truncated to 100
- [ ] Exact email match (case-insensitive) ranks #1
- [ ] Exact phone match (digits-only comparison) ranks #2
- [ ] Prefix match on first_name ranks #3
- [ ] Prefix match on last_name ranks #3 (tied with first_name prefix)
- [ ] Substring match on email ranks #4
- [ ] Substring match on first_name ranks #4
- [ ] Substring match on last_name ranks #4
- [ ] At most 20 results returned
- [ ] Soft-deleted guests (deleted_at IS NOT NULL) are excluded
- [ ] Guests from other tenants are excluded (tenant scope enforced)

### 5. Sensitive-field stripping tests (`__tests__/sensitive-fields.test.ts`)

- [ ] GET /api/guests/{id} response does NOT include `identity_doc_type`
- [ ] GET /api/guests/{id} response does NOT include `identity_doc_number`
- [ ] GET /api/guests/{id} response does NOT include `identity_doc_expiry`
- [ ] GET /api/guests response (list) does NOT include identity document fields
- [ ] GET /api/guests/search response does NOT include identity document fields

### 6. Repository tests (`__tests__/guests-repository.test.ts`)

Uses pg-mem fixture with seeded guest data.

- [ ] `createGuest(input)` inserts a row and returns the new guest_id
- [ ] `getGuestById(id)` returns the guest with all expected fields
- [ ] `getGuestById(id)` returns NULL for soft-deleted guests (or includes them with deleted_at; verify the behavior matches the API contract)
- [ ] `updateGuest(id, partial)` updates only the provided fields
- [ ] `listGuests(tenantId, { page, limit })` returns paginated results
- [ ] `listGuests` excludes soft-deleted guests
- [ ] `listGuests` respects tenant_id filter
- [ ] `getReservationsForGuest(guestId)` returns reservations ordered by check_in DESC
- [ ] `getLoyaltyForGuest(guestId)` returns the loyalty profile or NULL
- [ ] `searchGuests(tenantId, query)` returns up to 20 results, ranked per Section 4

### 7. Audit log tests (`__tests__/audit-log.test.ts`)

- [ ] POST /api/guests writes an audit log entry with action="CREATE", entity_type="guest", entity_id=<new guest_id>, before=NULL, after=<full guest JSON>
- [ ] PUT /api/guests/{id} writes an audit log entry with action="UPDATE", before=<previous state>, after=<new state>
- [ ] Audit log entries include actor_user_id from the JWT
- [ ] Audit log entries include tenant_id from the JWT
- [ ] Audit log writes do NOT block the response on failure (best-effort; verify by stubbing the audit insert to throw and confirming the POST still returns 201)
- [ ] Audit log entries are append-only (no UPDATE or DELETE API exists)

### 8. API endpoint integration tests (`__tests__/api-guests-endpoints.test.ts`)

Uses Next.js route handlers invoked directly with mocked Request objects.

#### POST /api/guests

- [ ] Happy path: valid body + authenticated JWT → 201 + guest object
- [ ] Validation: missing firstName → 400 VALIDATION_ERROR
- [ ] Validation: invalid email format → 400 VALIDATION_ERROR
- [ ] Auth: no JWT → 401 UNAUTHORIZED
- [ ] Conflict: email already exists in tenant → 409 CONFLICT
- [ ] Audit log entry written on success

#### GET /api/guests/{guestId}

- [ ] Happy path: existing guest + owner JWT → 200 + guest (sensitive fields stripped)
- [ ] Not found: non-existent guestId → 404 NOT_FOUND
- [ ] Forbidden: caller is not the owner and not staff → 403 FORBIDDEN
- [ ] Allowed: caller is staff with tenant scope → 200 + guest
- [ ] Sensitive fields stripped from response
- [ ] Phase derived correctly in response

#### PUT /api/guests/{guestId}

- [ ] Happy path: valid partial body + owner JWT → 200 + updated guest
- [ ] Not found → 404
- [ ] Forbidden (not owner) → 403
- [ ] Audit log entry written with before/after
- [ ] Updated_at column advances automatically (trigger fires)

#### GET /api/guests/{guestId}/reservations

- [ ] Happy path: returns paginated reservations ordered by check_in DESC
- [ ] Owner-only enforced
- [ ] Status filter works (`?status=CHECKED_IN`)
- [ ] Pagination metadata returned

#### GET /api/guests/{guestId}/loyalty

- [ ] Happy path: returns `{ tier, pointsBalance, totalStays }`
- [ ] Owner-only enforced
- [ ] Returns 404 if guest has no loyalty profile

#### GET /api/guests (list)

- [ ] Happy path: staff JWT → 200 + paginated list
- [ ] Tenant scope: caller sees only guests in their tenant
- [ ] Tenant scope: caller with no tenant_id claim and no qualifying group → 403 FORBIDDEN (fail-closed per Card 2)
- [ ] Pagination defaults: page=1, limit=20
- [ ] Max limit enforced: limit=200 → capped at 100
- [ ] Soft-deleted guests excluded

#### GET /api/guests/search

- [ ] Happy path: `?q=john` returns matching guests (ranked)
- [ ] Returns ≤ 20 results
- [ ] Excludes soft-deleted guests
- [ ] Tenant scope enforced
- [ ] Auth required: no JWT → 401
- [ ] Staff-only: Receptionist JWT OK; non-staff JWT → 403
- [ ] Query shorter than 2 chars → empty array (not 400; graceful degradation)

### 9. Documentation checks

- [ ] `docs/openapi.yaml` updated from stub to real spec (replaces the 501 Not Implemented responses)
- [ ] `docs/runbook/dsr-handling.md` references the new GET /api/guests export endpoint (TASK-005 fills in the rest)

### 10. CI checks (manual review)

- [ ] `.github/workflows/ci.yml` runs core unit tests (already covered by `pnpm -r test:unit`)
- [ ] CI does NOT require a real Postgres (pg-mem fixture used)

## Verification procedure

The Architect verifies TASK-003 by:

1. Reading the patch
2. Running `pnpm install && pnpm typecheck && pnpm test:unit && pnpm build` — all must pass
3. Manual review of the OpenAPI spec to confirm it matches Card 2 §4.2
4. Manual review of the sensitive-field stripping (verify the GET handler explicitly omits the fields)
5. Manual review of the audit log writes (verify they're best-effort, not blocking)
6. Manual review of the tenant scope resolver usage (every list endpoint calls it)

If all checks pass, the Architect:

- Marks TASK-003 as `done` in `openspec/tasks-registry.md`
- Updates `PROGRESS.md`
- Informs the user the patch is ready to apply

## What this testing file does NOT cover

- p95 latency on 10k guests (load test deferred)
- Real Cognito integration (using JWT per TASK-001)
- Multi-tenant runtime behavior (single-tenant deploy in v1; resolver tested in unit tests)
- DSR export (deferred to TASK-005)
- Identity document read endpoints (deferred to TASK-005)

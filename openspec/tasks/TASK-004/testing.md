# TASK-004 — Testing

**Phase**: 1 (Core)
**Status**: ready to verify
**Pairs with**: `task.md` in this folder

## Test categories

### 1. Static checks (CI must pass)

- [ ] `pnpm install` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` (Next.js) succeeds — /search and /profile/[id] routes compile
- [ ] No `console.log` outside test files
- [ ] No `any` types outside test fixtures

### 2. API client tests (`__tests__/api-client.test.ts`)

- [ ] `api.searchGuests("john")` returns the `data` array on success
- [ ] `api.searchGuests("")` returns empty array (API returns [])
- [ ] `api.getGuest(id)` returns the guest object on success
- [ ] `api.getGuest("nonexistent")` throws ApiError with code "NOT_FOUND"
- [ ] `api.getGuest` on a 401 throws ApiError with code "UNAUTHORIZED"
- [ ] `api.getGuest` on a 403 throws ApiError with code "FORBIDDEN"
- [ ] `api.getGuest` on a 500 throws ApiError with code "INTERNAL_ERROR"
- [ ] `ApiError` preserves the `details` field from the response body
- [ ] All requests include `credentials: "include"` (sends the httpOnly cookie)

### 3. Search input component tests (`__tests__/search-input.test.tsx`)

- [ ] Renders an input with `role="combobox"` and `aria-expanded`
- [ ] Empty input shows hint text "Start typing to search guests"
- [ ] Typing fires a debounced search (200ms)
- [ ] Less than 2 characters does NOT fire a search
- [ ] Loading state shows skeleton list (3 placeholder rows)
- [ ] Arrow Down moves highlight to first result
- [ ] Arrow Down again moves to second result
- [ ] Arrow Up moves highlight back
- [ ] Enter selects the highlighted result and calls onSelect
- [ ] Esc clears the input and results
- [ ] `aria-live="polite"` announces "N results found"

### 4. Search results list tests (`__tests__/search-results-list.test.tsx`)

- [ ] Renders up to 20 results
- [ ] Each result has `role="option"`
- [ ] Highlighted result has `aria-selected="true"`
- [ ] Click on a result calls onSelect
- [ ] Empty results array shows "No guests found" message
- [ ] Avatar shows initials (first letter of first_name + first letter of last_name, uppercased)
- [ ] Avatar falls back to "?" when name is null
- [ ] Phase badge renders with correct variant per the phase mapping

### 5. Profile detail tests (`__tests__/profile-detail.test.tsx`)

- [ ] Renders profile header (avatar, name, phase badge, last stay date)
- [ ] Renders contact section (email, phone, address)
- [ ] Email is a mailto: link
- [ ] Phone is a tel: link
- [ ] Renders preferences as key-value pairs
- [ ] Renders up to 5 reservations, sorted by check_in DESC
- [ ] Each reservation shows date range, room type, status badge
- [ ] Renders loyalty section (tier, points, total stays)
- [ ] "Fill form" button exists but is disabled in TASK-004
- [ ] NEVER displays identity_doc_type, identity_doc_number, identity_doc_expiry (Card 2 §4.4)
- [ ] Loading state shows skeleton matching the final shape
- [ ] Not-found state shows "Guest not found." + back-to-search link

### 6. Avatar component tests (`__tests__/avatar.test.tsx`)

- [ ] Renders initials (first letter of first_name + first letter of last_name, uppercased)
- [ ] Falls back to "?" when both names are null
- [ ] Falls back to "?" when first_name is null but last_name is not (and vice versa)
- [ ] Background color is deterministic from guest_id (same guest_id always produces same color)
- [ ] Background color is one of the palette (not random)

### 7. Phase badge tests (`__tests__/phase-badge.test.tsx`)

- [ ] IN_HOUSE → success variant (green)
- [ ] CHECKIN_DAY → warning variant (amber)
- [ ] PRE_CHECKIN → warning variant (amber)
- [ ] POST_STAY → default variant (gray)
- [ ] IDLE → default variant (gray)
- [ ] UNKNOWN_CONTACT → default variant (gray)
- [ ] ESCALATED → danger variant (red)

### 8. E2E smoke tests (`e2e/receptionist.spec.ts`)

- [ ] `/search` page renders with the search input visible
- [ ] Typing "john" produces a network request to `/api/guests/search?q=john`
- [ ] Clicking a search result navigates to `/profile/[guestId]` (or loads in right pane)
- [ ] Profile detail page renders the guest's name
- [ ] Unauthenticated `/search` redirects to `/login?redirect=/search`

### 9. Documentation checks

- [ ] `README.md` updated to mention `/search` as the receptionist's primary screen
- [ ] `ARCHITECTURE.md` mentions the two-pane layout

### 10. CI checks

- [ ] Existing CI pipeline runs the new tests
- [ ] No new flaky tests

## Verification procedure

The Architect verifies TASK-004 by:

1. Reading the patch
2. Running `pnpm install && pnpm typecheck && pnpm test:unit && pnpm build` — all must pass
3. Manual review of the search input's keyboard navigation (no infinite loops, no off-by-one)
4. Manual review of the avatar's color determinism (same guest_id → same color)
5. Manual review of the phase badge mapping (matches the table in task.md)
6. Manual review of sensitive-field stripping at the UI layer (the profile detail component should never attempt to render identity_doc_*)

If all checks pass, the Architect:

- Marks TASK-004 as `done` in `openspec/tasks-registry.md`
- Updates `PROGRESS.md`

## What this testing file does NOT cover

- p95 latency on the search endpoint (covered in TASK-003)
- Browser extension behavior (TASK-006)
- Admin UI (TASK-005)
- Mobile layout (not in v1 scope)

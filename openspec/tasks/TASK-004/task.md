# TASK-004 — Receptionist Web UI

**Phase**: 1 (Core)
**Status**: in_progress
**Estimated effort**: 1 week single-dev
**Depends on**: TASK-001 (foundation), TASK-003 (guest profile API — provides the data this UI renders)

## What this task produces

The receptionist's primary work surface — a single-page web UI that lets the receptionist:
1. Type a few characters in a search box
2. See matching guest profiles appear live as they type (target: < 300ms response)
3. Click a profile to see full guest detail (contact, address, preferences, reservations, loyalty, phase)
4. Have everything feel polished, modern, art-directed (per the user's design brief)

After this task: a receptionist can use the system end-to-end for guest lookup. They cannot yet auto-fill the hotel's registration form (that's TASK-006 — the browser extension).

## Scope

### In scope

1. **`/search` route** — the receptionist's primary screen
   - Two-pane layout: left = search + results; right = selected profile detail
   - Search input with 200ms debounce (calls `GET /api/guests/search?q=...`)
   - Results list: avatar circle (initials), name, email, phone, last stay date, phase badge
   - Click a result → loads full profile in the right pane
   - Keyboard navigation (up/down arrow through results, Enter to select, Esc to clear)
   - Empty state (no results), loading state (skeleton), error state (toast)

2. **`/profile/[guestId]` route** — full guest detail (right pane content)
   - Header: avatar (initials), name, phase badge, last stay date
   - Contact section: email, phone, address (region-aware)
   - Preferences section: preferences JSONB rendered as key-value pairs
   - Reservations section: last 5 reservations (date range, room type, status badge)
   - Loyalty section: tier badge, points balance, total stays
   - "Fill form" button (calls TASK-006 extension — placeholder button for now)
   - Loading skeleton; not-found state; error toast

3. **API client wrapper** (`packages/core/lib/api-client.ts`)
   - Typed fetch with credentials: 'include' (sends httpOnly cookie)
   - Standard envelope unwrapping (returns `data` on success; throws on `success: false`)
   - Error typing: `ApiError` class with `code`, `message`, `details`
   - Used by both the receptionist UI and (later) the admin UI

4. **Loading / empty / error states** (per PM Plan §14.4 — "skeletons not spinners")
   - Skeletons for all async content (profile, reservations, loyalty, search results)
   - Empty states with helpful illustrations + next-step CTAs
   - Error toasts (using sonner, already in TASK-001)

5. **Accessibility** (per PM Plan §14.4 — WAI-ARIA via Radix primitives)
   - Keyboard navigation on the search results list (arrow keys, Enter, Esc)
   - Focus rings on all interactive elements
   - ARIA roles: `listbox`, `option`, `aria-selected`, `aria-live` for search results count
   - Screen reader announces results count and selected profile

6. **Responsive layout** (per PM Plan §14.4 — desktop-first, tablet graceful)
   - Desktop (>= 1024px): two-pane side-by-side
   - Tablet (768–1023px): single pane, profile opens as overlay
   - Mobile (< 768px): NOT designed for v1 (receptionist works at a desk)

7. **Tests** — Vitest component tests + Playwright e2e smoke

### Out of scope

- Admin UI (TASK-005)
- Browser extension form-fill (TASK-006 — the "Fill form" button is a placeholder)
- Multi-language UI (English only in v1, per Blueprint area 26)
- Guest-facing portal (guests never log in)
- Mobile layout
- Print-friendly view (receptionist doesn't print)

## Implementation brief

### File layout

```
packages/core/
├── app/
│   ├── search/
│   │   ├── page.tsx                      Receptionist search screen (two-pane)
│   │   └── layout.tsx                   Auth guard (redirect to /login if no JWT)
│   ├── profile/
│   │   └── [guestId]/
│   │       └── page.tsx                  Full guest detail
│   └── (the existing /login, /design-system, /, /api/* routes from TASK-001/003)
├── components/
│   ├── guest/
│   │   ├── search-input.tsx              Debounced search input with keyboard nav
│   │   ├── search-results-list.tsx       List of matching profiles
│   │   ├── search-result-item.tsx        One result row (avatar, name, phase badge)
│   │   ├── profile-detail.tsx            Right pane: full guest detail
│   │   ├── profile-header.tsx            Avatar + name + phase badge
│   │   ├── profile-contact.tsx           Email, phone, address
│   │   ├── profile-reservations.tsx      Last 5 reservations
│   │   ├── profile-loyalty.tsx            Loyalty tier + points
│   │   └── profile-skeleton.tsx          Loading state
│   └── ui/ (existing from TASK-001)
└── lib/
    └── api-client.ts                     Typed fetch wrapper
```

### API client (`lib/api-client.ts`)

```typescript
import type { Guest, Reservation, LoyaltyProfile, ApiResponse } from "@gps/shared";

export class ApiError extends Error {
  constructor(public code: string, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...init });
  const body: ApiResponse<T> = await res.json();
  if (!body.success || body.error) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? "Unknown error",
      body.error?.details,
    );
  }
  return body.data as T;
}

export const api = {
  searchGuests: (q: string) =>
    apiFetch<Guest[]>(`/api/guests/search?q=${encodeURIComponent(q)}`),
  getGuest: (id: string) =>
    apiFetch<Guest>(`/api/guests/${id}`),
  getReservations: (id: string) =>
    apiFetch<Reservation[]>(`/api/guests/${id}/reservations?limit=5`),
  getLoyalty: (id: string) =>
    apiFetch<{ tier: string; pointsBalance: number; totalStays: number }>(
      `/api/guests/${id}/loyalty`
    ),
};
```

### Search screen behavior

- **Input debounce**: 200ms after the user stops typing, fire the search query
- **Minimum query length**: 2 characters (matches the API's validation)
- **Keyboard navigation**:
  - ↑ / ↓ arrows move the highlight through results
  - Enter selects the highlighted result
  - Esc clears the search input and the results
  - Tab moves focus to the next focusable element
- **ARIA**: search input has `role="combobox"`; results list has `role="listbox"`; each result has `role="option"` and `aria-selected` when highlighted; `aria-live="polite"` announces "N results found"
- **States**:
  - Empty query → no results list (show hint text: "Start typing to search guests")
  - Loading → skeleton list (3 placeholder rows)
  - No results → "No guests found. Try a different search term."
  - Error → toast: "Search failed. Please try again."
  - Success → list of up to 20 results

### Profile detail behavior

- **Loading**: skeleton layout matching the final shape
- **Not found**: "Guest not found." with a back-to-search link
- **Error**: toast + retry button
- **Sections** (in order):
  1. Header: avatar (initials in colored circle), name, phase badge, last stay date
  2. Contact: email (mailto link), phone (tel link), address (formatted by region)
  3. Preferences: JSONB rendered as key-value pairs (collapsible)
  4. Reservations: last 5, sorted by check_in DESC (date range, room type, status badge)
  5. Loyalty: tier badge, points balance, total stays
  6. Action: "Fill form" button (placeholder — disabled in TASK-004, enabled in TASK-006)

### Phase badges (reuse from TASK-001's Badge component)

| Phase | Badge variant | Color |
|---|---|---|
| IN_HOUSE | success | green |
| CHECKIN_DAY | warning | amber |
| PRE_CHECKIN | warning | amber |
| POST_STAY | default | gray |
| IDLE | default | gray |
| UNKNOWN_CONTACT | default | gray |
| ESCALATED | danger | red |

### Avatar (initials)

- 40px circle, background = hashed color from guest_id (deterministic), white text
- Initials = first letter of first_name + first letter of last_name, uppercased
- Fallback: "?" if name is null

## Acceptance criteria

1. `pnpm install` succeeds (no new dependencies)
2. `pnpm typecheck` passes
3. `pnpm test:unit` passes — at least 15 new test cases
4. `pnpm build` (Next.js) succeeds — /search and /profile/[id] routes compile
5. `/search` page renders with empty state
6. Typing in the search input debounces correctly (200ms)
7. Search results render with avatar, name, email, phase badge
8. Clicking a result loads the profile in the right pane
9. Keyboard navigation works (arrows, Enter, Esc)
10. Profile detail renders all 5 sections
11. Sensitive fields (identity_doc_*) are NEVER displayed (Card 2 §4.4)
12. Loading states use skeletons, not spinners
13. Error states show toasts
14. Layout is two-pane on desktop, single-pane with overlay on tablet

## Hand-off

When TASK-004 is `done`:

1. Architect verifies against `testing.md`
2. Architect marks `done` in `openspec/tasks-registry.md`
3. TASK-005 (admin UI) and TASK-006 (browser extension) become unblocked

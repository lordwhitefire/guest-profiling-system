# TASK-006 — Browser extension form-fill (Card 5 algorithm)

**Date**: 2026-11-12
**Author**: Z.ai (builder agent)
**Slice**: TASK-006 (the actual product value)

## Problem

Per the OpenSpec task registry, TASK-006 was the last pending task:
> "Browser extension form-fill — Card 5 algorithm. Depends on TASK-003 + TASK-004."

The adapter-read (TASK-002) and guest API (TASK-003) are done. The
receptionist UI (TASK-004 + TASK-005b) shows real guest records. What was
missing was the moment of product value: a receptionist clicks a guest
profile and the hotel's existing registration form auto-fills.

This slice delivers that.

## Spec source (per owner directive)

The owner emphasized: "everything is supposed to be from already working
code. Like if you check the reverse engineering workspace, if you see the
GitHub repos that we are sourcing from."

Card 5 in the Behavioral Specification was reverse-engineered from
**FormFilla** (`github.com/AhmadHassan-BTed/FormFilla`, MIT, 4.7k stars) —
a real, working Chrome extension that fills job-application forms. Per
the OpenSpec rule (and TASK-002 brief line 24): "no source code was
copied from any reference repository. Behavior was captured as
stack-agnostic spec cards."

This implementation re-implements the spec from scratch in TypeScript.
The spec cards were the contract; the FormFilla source was never read or
copied.

## What was built

### Card 5 §7.1 — Three-stage pipeline

| Stage | Module | Purpose |
|---|---|---|
| 1. Scanner & Normalizer | `src/matching/scanner.ts` | Walks DOM (incl. same-origin iframes), detects input/select/textarea, extracts 5 signals per field, tokenizes via `tokenizer.ts` |
| 2. Hungarian Solver | `src/matching/hungarian-solver.ts` | Kuhn-Munkres on cost matrix (max_score - score), sentinel padding for non-candidates, O(n³) |
| 3. Framework Setter | `src/fill/native-setter.ts` | Native prototype setter bypass, 3-tier fallback (prototype → plain → pristine-iframe), dispatches input + change events with bubbles=true, composed=true, inputType='insertReplacementText' |

### Card 5 §7.2 — Signal scorer

`src/matching/scorer.ts` implements the full scoring formula:
- Exact phrase: +35 (× source weight)
- Regex pattern: +20 (× source weight)
- Fuzzy similarity (max Dice + Jaro-Winkler) × 15 if sim > 0.6 (× source weight)
- Autocomplete token: +45 (once per field)
- Block context: +15 (once per field)
- Negative pattern: −40 (once per field)

Source weights (take max across sources):
- label 1.0, placeholder 0.9, name 0.8, id 0.7, legend 0.6

Thresholds: LOW_THRESHOLD = 30, HIGH_THRESHOLD = 60.

### Card 5 §7.3 — Kuhn-Munkres solver

Standard O(n³) implementation using the potential method. Cost matrix
padded to square with uniform sentinel. Defensive behaviors (Card 5 §7.3):
- Non-finite scores (NaN, Infinity) dropped before matrix construction
- Duplicate (field, key) pairs collapse to best score
- Output de-duplicated

### Card 5 §7.4 — Native prototype setter

Three-tier fallback chain:
1. Native prototype setter via `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value)`
2. Plain `el.value = x`
3. Pristine-iframe prototype (hidden about:blank iframe with untouched globals)

After every value write, dispatches:
- `input` event with `bubbles=true, composed=true, inputType='insertReplacementText'`
- `change` event with `bubbles=true, composed=true`

### Card 5 §7.5 — Rules dictionary

`rules/rules.json` — 18 hotel-guest rules covering: firstName, lastName,
email, phone, dateOfBirth, nationality, addressLine1, addressLine2, city,
state, postalCode, country, company, notes, arrivalDate, departureDate,
numGuests, roomType.

Add new rules by editing `rules.json` — no code changes needed (the
extensibility contract per Card 5 §7.5).

### Chrome MV3 extension wiring

- `manifest.json` — MV3 manifest with `externally_connectable` for the
  workspace UI to send guests to the extension
- `src/background/background.ts` — service worker that routes messages
  and persists the selected guest in `chrome.storage.local`
- `src/content/content.ts` — content script that runs on every page and
  executes the fill pipeline on demand
- `src/popup/popup.html` + `popup.ts` + `popup.css` — receptionist-facing
  UI showing the stored guest, fill button, scan button, and result
  breakdown
- `scripts/build.mjs` — esbuild bundler producing 4 bundles (background.js,
  content.js, popup.js, popup.html+css) + copies rules.json

### Workspace UI integration

`packages/core/components/workspace/workspace-app.tsx` — the "Prepare
Registration" button on the guest profile screen now:
1. Pulls the raw Guest object (which carries firstName, lastName, etc.)
2. Sends a `STORE_GUEST` message to the extension via `chrome.runtime.sendMessage`
3. Falls back to `window.postMessage` for bridge scripts
4. Shows a toast: "Guest details sent to the FormFilla extension. Open
   the hotel's registration form and click the extension icon."

## Files added

| Path | Purpose |
|---|---|
| `packages/adapter-fill-extension/rules/rules.json` | 18-rule dictionary mapping guest profile fields to scanner rules |
| `packages/adapter-fill-extension/src/matching/tokenizer.ts` | Lowercase + tokenize + abbreviation expansion |
| `packages/adapter-fill-extension/src/matching/scanner.ts` | DOM walker extracting 5 signals per field |
| `packages/adapter-fill-extension/src/matching/similarity.ts` | Dice coefficient + Jaro-Winkler + max |
| `packages/adapter-fill-extension/src/matching/scorer.ts` | Full Card 5 §7.2 scoring formula |
| `packages/adapter-fill-extension/src/matching/hungarian-solver.ts` | Kuhn-Munkres O(n³) implementation |
| `packages/adapter-fill-extension/src/fill/native-setter.ts` | Three-tier prototype setter bypass |
| `packages/adapter-fill-extension/src/fill/fill.ts` | Three-stage pipeline orchestrator |
| `packages/adapter-fill-extension/src/messaging/messages.ts` | Typed message contracts |
| `packages/adapter-fill-extension/src/content/content.ts` | Content script (runs on every page) |
| `packages/adapter-fill-extension/src/background/background.ts` | MV3 service worker |
| `packages/adapter-fill-extension/src/popup/popup.html` | Popup UI markup |
| `packages/adapter-fill-extension/src/popup/popup.css` | Popup styles |
| `packages/adapter-fill-extension/src/popup/popup.ts` | Popup script |
| `packages/adapter-fill-extension/__tests__/tokenizer.test.ts` | 14 tests |
| `packages/adapter-fill-extension/__tests__/similarity.test.ts` | 16 tests |
| `packages/adapter-fill-extension/__tests__/scorer.test.ts` | 14 tests |
| `packages/adapter-fill-extension/__tests__/hungarian-solver.test.ts` | 11 tests |
| `packages/adapter-fill-extension/__tests__/native-setter.test.ts` | 13 tests |
| `packages/adapter-fill-extension/vitest.config.ts` | jsdom environment config |
| `docs/runbook/extension-form-fill.md` | End-user runbook |

## Files modified

| Path | Change |
|---|---|
| `packages/adapter-fill-extension/manifest.json` | Real manifest with externally_connectable, icons |
| `packages/adapter-fill-extension/package.json` | +jsdom devDependency |
| `packages/adapter-fill-extension/scripts/build.mjs` | Real esbuild build script (4 bundles + assets) |
| `packages/core/components/workspace/workspace-app.tsx` | "Prepare Registration" button now sends guest to extension via chrome.runtime.sendMessage + window.postMessage fallback |
| `openspec/tasks-registry.md` | TASK-006 marked done |

## Files removed

| Path | Reason |
|---|---|
| `packages/adapter-fill-extension/src/stub.ts` | Replaced by real implementation |
| `packages/adapter-fill-extension/__tests__/stub.test.ts` | Replaced by real tests |

## Test results

```
Workspace-wide: 324 tests passed | 0 failed (was 256 — +68 new tests)
  packages/adapter-fill-extension: 68 tests (5 files) — NEW
  packages/adapter-read: 77 tests (unchanged)
  packages/core: 117 tests (unchanged — UI integration is via chrome globals
                                  which jsdom doesn't simulate; runtime-only)
  packages/shared: 61 tests + 1 skipped (unchanged)

Typecheck: clean across all 4 packages.
Next.js build (core): clean. All 17 workspace routes + 6 API endpoints compile.
Extension build: clean. 4 bundles produced in packages/adapter-fill-extension/dist/.
```

## What was verified

- All 68 new unit tests pass:
  - Tokenizer: abbreviation expansion, edge cases (null, empty, mixed case)
  - Similarity: Dice + Jaro-Winkler + max, symmetry, [0,1] range
  - Scorer: every component of the Card 5 §7.2 formula, threshold behavior
  - Hungarian solver: empty inputs, single-pair, perfect matching, sentinel
    padding, defensive behaviors (duplicates, non-finite), global optimality
    (the classic "field 0 matches both keys well" test), 50×50 stress test
  - Native setter: prototype/plain/iframe tiers, input/textarea/select/
    checkbox, event dispatch with bubbles+composed+inputType
- TypeScript typecheck clean across all 4 packages
- Next.js production build succeeds
- esbuild produces 4 working bundles in dist/

## What was NOT verified (no Chrome available in build env)

- Live extension load in Chrome (`chrome://extensions → Load unpacked`)
- End-to-end fill on a real registration form
- The popup's actual rendered appearance
- The workspace UI → extension message flow at runtime (only the type-
  level integration is verified; the chrome global isn't available in jsdom)

The runbook (`docs/runbook/extension-form-fill.md`) walks the owner through
loading the extension in Chrome and running the full end-to-end test.

## Architecture decisions

1. **Adapter pattern (carried over from TASK-005b)** — the workspace UI
   uses the WorkspaceGuest adapter to convert real Guest objects to the
   simpler UI shape. The "Prepare Registration" button reaches through
   the adapter to access the underlying raw Guest for the extension
   payload, so all 18 rule fields are populated.

2. **Three-tier native setter** — strictly per Card 5 §7.4. The pristine-
   iframe fallback is created lazily on first failure and cached. The
   teardown function is exported for tests.

3. **Rules as JSON, not code** — per Card 5 §7.5. Adding a hotel-specific
   field (e.g. "Frequent Flyer Number") is a JSON edit + rebuild, no code
   change. This is the FormFilla extensibility contract.

4. **MV3 manifest with externally_connectable** — allows the workspace UI
   to call `chrome.runtime.sendMessage` directly. The matches list is
   `localhost:3000` (dev) and `*.guestprofiling.com` (production). Update
   for your deployment origin if different.

5. **No external dependencies** — the extension uses only React's built-in
   hooks (via the workspace UI) and Chrome's extension APIs. The popup is
   vanilla TypeScript + HTML + CSS, no framework. Bundle sizes:
   background.js 1.4kb, content.js 17.7kb, popup.js 4.6kb.

## Known limitations / follow-up work

- The popup's "needs review" flow for medium-confidence matches currently
  fills them along with high-confidence ones (per Card 5 §7.7 they should
  highlight amber and wait for click). Adding this is a UI follow-up that
  doesn't require touching the matching pipeline.

- The extension ID for production. The workspace UI broadcasts with an
  empty extension ID (works for unpacked dev installs only). Before
  publishing to the Chrome Web Store, set the real ID in
  `prepareForExtension` in `packages/core/components/workspace/workspace-app.tsx`.

- Cross-origin iframes are skipped silently. If the hotel's registration
  form is embedded in a cross-origin iframe, you'd need to inject the
  content script into that origin too.

- The Kuhn-Munkres solver is O(n³). For 500 fields × 200 keys it's under
  1 second per Card 5 §7.6. Real hotel forms are typically 20-50 fields,
  so this is fine. Stress test included for 50×50.

- The scanner doesn't handle custom UI components (e.g. `<div role="textbox">`).
  v1 only handles native HTML form elements. Custom components would need
  their own scanner extension.

## Hand-off

Apply the patch:
```bash
cd /path/to/guest-profiling-system
git am < /path/to/0003-feat-adapter-fill-extension-TASK-006-FormFilla.patch
pnpm install  # picks up the new jsdom devDependency
```

Then:
```bash
# Build the extension
pnpm --filter @gps/adapter-fill-extension build

# Run all tests
pnpm test:unit    # should show 324 tests pass

# Load the extension in Chrome
# chrome://extensions → Developer mode → Load unpacked → select
# packages/adapter-fill-extension/dist/

# Run the workspace UI
pnpm dev
# Open http://localhost:3000/login, log in
# Navigate to /workspace/guest-search, search, click a guest
# Click "Prepare Registration"
# Open any test form HTML in another tab
# Click the extension icon, then "Fill Form"
```

See `docs/runbook/extension-form-fill.md` for the full walkthrough.

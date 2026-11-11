# Runbook: FormFilla Browser Extension (TASK-006)

This runbook walks through loading and testing the Chrome MV3 browser extension
that auto-fills the hotel's existing registration form from a selected guest
profile.

## What it does

When a receptionist:
1. Opens the Guest Profiling System workspace
2. Searches for and selects a guest
3. Clicks "Prepare Registration"
4. Navigates to the hotel's PMS registration form (any URL)
5. Clicks the extension's toolbar icon
6. Clicks "Fill Form" in the popup

The extension:
1. Scans the active DOM for form fields (input, select, textarea)
2. Extracts 5 signals per field (label, placeholder, name, id, legend)
3. Tokenizes and normalizes each signal against an abbreviation dictionary
4. Scores every (field, candidate profile key) pair using the Card 5 formula
5. Solves the field-to-key assignment as a maximum-weight bipartite matching
   via the Kuhn-Munkres algorithm
6. Writes values via the native prototype setter bypass (works on React/Vue/Angular pages)
7. Dispatches input + change events with bubbles=true, composed=true,
   inputType='insertReplacementText'

## Step 1 — Build the extension

```bash
pnpm --filter @gps/adapter-fill-extension build
```

Output goes to `packages/adapter-fill-extension/dist/`. Files produced:
- `background.js` (MV3 service worker)
- `content.js` (content script, IIFE)
- `popup.js` (popup script, IIFE)
- `popup.html` + `popup.css`
- `manifest.json`
- `rules/rules.json` (the matching rules dictionary)

## Step 2 — Load as unpacked extension in Chrome

1. Open `chrome://extensions`
2. Toggle "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select `packages/adapter-fill-extension/dist/`
5. The extension appears in your extensions list as "Guest Profiling System — Form Fill"
6. Pin it to your toolbar for easy access

## Step 3 — Set up the workspace UI to talk to the extension

The workspace UI's "Prepare Registration" button uses `chrome.runtime.sendMessage`
to send the guest data to the extension. For this to work, the workspace UI's
origin must be in the extension's `externally_connectable.matches` list (already
set to `localhost:3000` and `*.guestprofiling.com`).

If you're running on a different origin (e.g. a preview URL), update
`packages/adapter-fill-extension/manifest.json`'s `externally_connectable.matches`
and rebuild.

## Step 4 — End-to-end test

1. Start the workspace UI:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000/login`, log in.

2. Navigate to `/workspace/guest-search`, search for a guest, click a result.

3. On the guest profile screen, click "Prepare Registration". You should see
   a toast: "Guest details sent to the FormFilla extension."

4. Open any test form in another tab. For a quick test, use this minimal HTML:
   ```html
   <form>
     <label>First Name <input type="text" name="first_name" autocomplete="given-name"></label><br>
     <label>Last Name <input type="text" name="last_name" autocomplete="family-name"></label><br>
     <label>Email <input type="email" name="email" autocomplete="email"></label><br>
     <label>Phone <input type="tel" name="phone" autocomplete="tel"></label><br>
     <button type="submit">Submit</button>
   </form>
   ```
   Save as `test-form.html` and open it in Chrome.

5. Click the extension's toolbar icon. You should see the popup with the
   stored guest's name and email.

6. Click "Fill Form". The form fields should populate. The popup should
   show a summary: "X filled silently, Y need review, Zms".

7. Click "Scan Page Only" to preview what fields the scanner detected
   without writing anything.

## How the matching works

The extension uses a 4-stage pipeline (per Card 5 §7.1):

```
Active DOM → Scanner → Scorer → Kuhn-Munkres Solver → Native Setter → Filled Form
```

### Scoring formula (Card 5 §7.2)

Per (field, candidate key) pair:

| Component | Points | Applied |
|---|---|---|
| Exact phrase match | +35 | Per source, × source weight |
| Regex pattern match | +20 | Per source, × source weight |
| Fuzzy similarity (max Dice + Jaro-Winkler) × 15 | if sim > 0.6 | Per source, × source weight |
| Negative pattern match | −40 | Once per field |
| Autocomplete token match | +45 | Once per field |
| Block context bonus | +15 | Once per field |

Source weights (take max across sources):
- label: 1.0
- placeholder: 0.9
- name: 0.8
- id: 0.7
- legend: 0.6

Thresholds:
- `LOW_THRESHOLD` = 30 (below this, candidate is excluded)
- `HIGH_THRESHOLD` = 60 (at or above, fill silently; below, highlight for confirmation)

### The Hungarian solver (Card 5 §7.3)

The cost matrix is `cost = max_score - score`. The matrix is padded to square
with a uniform sentinel cost so that fields with no genuine candidate don't
steal keys from deserving fields.

Critical correctness property: because every non-candidate cell costs
exactly the same, total cost over any perfect matching always decomposes as
`(matrix size) × sentinel − (sum of scores used)`. Minimizing that is
identical to maximizing total matched score.

### Native setter (Card 5 §7.4)

Three-tier fallback chain:
1. Native prototype setter via `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value)`
2. Plain `el.value = x`
3. Pristine-iframe prototype (hidden about:blank iframe with untouched globals)

After every value write, dispatch:
- `input` event with `bubbles=true, composed=true, inputType='insertReplacementText'`
- `change` event with `bubbles=true, composed=true`

## Adding hotel-specific rules

Edit `packages/adapter-fill-extension/rules/rules.json`. Each key is a guest
profile field; each value is a rule object. The extension picks up changes
on the next build — no code changes needed.

Example rule for a hotel-specific "Frequent Flyer Number" field:

```json
"frequentFlyerNumber": {
  "exactPhrases": ["frequent flyer", "ff number", "flyer number"],
  "regexPatterns": ["^ff[_-]?num(ber)?$", "^frequent[_-]?flyer$"],
  "autocompleteTokens": [],
  "allowedTypes": ["text", null],
  "negativePatterns": []
}
```

After adding, rebuild:
```bash
pnpm --filter @gps/adapter-fill-extension build
```

Then reload the extension in `chrome://extensions` (click the refresh icon).

## Troubleshooting

- **Extension doesn't show stored guest**: make sure you clicked "Prepare
  Registration" in the workspace UI first. The popup reads from
  `chrome.storage.local` — if no guest was stored, it shows "No guest selected."

- **Fill doesn't work on a React form**: the native setter bypass should
  handle this. If values appear in the DOM but the form doesn't recognize
  them, check that the page's framework listens for the `input` event with
  `bubbles=true`. Most do; some custom UIs require a `blur` event too
  (not yet dispatched — TODO).

- **Scan returns 0 fields**: the scanner skips hidden/submit/button/file
  inputs. If your form uses custom components (e.g. `<div role="textbox">`),
  those won't be detected. v1 only handles native HTML form elements.

- **`chrome.runtime.sendMessage` from the workspace UI fails silently**:
  this is expected in dev without the extension installed. The window.postMessage
  fallback is also fired, so a bridge script could pick it up. For production,
  set the extension ID in the `prepareForExtension` function in
  `packages/core/components/workspace/workspace-app.tsx`.

## What's NOT yet wired

- The popup's "needs review" flow for medium-confidence matches. Currently
  the popup shows the breakdown but doesn't let the receptionist selectively
  accept/reject individual matches. The high-confidence ones fill silently;
  medium-confidence ones also fill (per the spec they should highlight
  amber and wait for click — that UI is a follow-up).

- The extension ID for production. Currently the workspace UI broadcasts
  with an empty extension ID, which only works for unpacked dev installs.
  Before publishing to the Chrome Web Store, set the real extension ID in
  `packages/core/components/workspace/workspace-app.tsx`'s `prepareForExtension`
  function.

- The Kuhn-Munkres solver is O(n³). For 500 fields × 200 keys it's under 1
  second per Card 5 §7.6. We have a stress test for 50×50 that's well under
  that. Real hotel forms are typically 20-50 fields, so this is fine.

- Cross-origin iframes are skipped silently. If the hotel's registration
  form is embedded in a cross-origin iframe, you'd need to inject the
  content script into that origin too (via the manifest's `host_permissions`).

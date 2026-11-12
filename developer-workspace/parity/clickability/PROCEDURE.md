# PROCEDURE — finding what is supposed to be clickable

Use this whenever a site must be mapped for clickability. It is deliberately
**intent-led**, not selector-led: a selector scan is evidence, not the map.

## Definitions

- **Control root** — the nearest element that owns the interaction: it has a React
  `onClick`/`onChange`/`onSubmit`, an `href`, native control semantics (`button`, `select`,
  `input`, `textarea`), or an interactive ARIA role. Descendant spans/svg/paths are **not**
  separate controls.
- **Supposed-clickable** — a control root **plus** every element the screen contract presents
  as interactive (a chevron on a hotel name, a three-dots row, an icon-only affordance) even
  when the DOM exposes no role or handler.
- **Wired** — has a handler, `href`, form submission, or native editing behaviour.
- **Dead** — presents as interactive but has none of the above.
- **Fake** — wired, but the effect is only a toast while the label claims real work (export,
  sync, test, save).
- **Static** — decorative; not a control. Must not carry a control affordance (chevron,
  hover, pointer cursor) unless the map declares it decorative.

## Signals and their limits

| Signal | Gives | Limit |
|---|---|---|
| Accessibility tree (role, name, focusable) | what assistive tech sees | clickable `div`s can be `StaticText`; a handler-less `<button>` still has role `button` |
| Native listeners (`getEventListeners`, CDP `DOMDebugger.getEventListeners`) | `addEventListener` wiring | React 17+ delegates at the root; per-element scans under-report |
| React props (`__reactProps$…`) | the actual handler prop on the DOM node | internal key, not a public API |
| Visual affordance (`cursor:pointer`, hover, chevron, icon-only) | what a user will try | hint only; inert `div`s may not even get `pointer` |
| Source / screen contract | what the screen is *supposed* to do | must be read, never guessed |

No single signal is the map. The map is the union.

## Steps

### 1. Serve the production build

`next build` then `next start` (or the equivalent). Never map a dev server: it injects its
own runtime and recompiles while the source stands still. Check the served HTML for dev
markers (`/_next/static/development/`, Vite HMR, React Refresh) before opening the browser.

### 2. Inventory every page

List every route from the app tree, including dynamic routes and static state pages. Resolve
dynamic params with a real id from the API. Record the auth state each page needs. For public
pages, map them with cookies cleared; re-authenticate afterwards.

### 3. Capture per page

For each route, at a declared viewport:

1. Load and settle (DOM content + a short wait for data).
2. Collect **control roots**: native controls, `href`, interactive ARIA roles, and elements
   with a React handler prop. Deduplicate ancestors/descendants.
3. For each root record: label, tag, role, `type`, `href`, `tabIndex`, computed `cursor`,
   handler keys, a short handler source, `form` owner, disabled state.
4. Capture the **accessibility snapshot** for the key controls (role + name).
5. Collect **declared affordances** from the screen contract: chevrons, three-dots rows,
   icon-only controls, hotel/user switchers. These are supposed-clickable even with no
   handler.
6. Collect **static decorations** that must not look clickable (breadcrumb separators,
   status pills). If one carries a chevron or pointer cursor, flag it.

### 4. Normalise

- Deduplicate the shared shell (sidebar + topbar) across pages; keep the list of routes where
  it appears.
- Keep page-specific controls under their route.
- Never merge controls by text alone: two “Cancel” buttons in different forms are two rows.
- Mark the **source of expectation** for every row: `semantics`, `handler`, `href`,
  `affordance`, or `contract`.

### 5. Classify

- `WIRED` — handler / href / submit / native editing.
- `DEAD` — supposed-clickable but nothing wired.
- `FAKE` — wired to a toast only, while the label claims work. Verify by handler source and
  by the click pass.
- `INPUT` — editable native field; not a click action.
- `STATIC` — decoration; no affordance.

### 6. Click pass (second phase)

On the production build, click each `WIRED`, `DEAD` and `FAKE` row and record the effect:

- route change, modal, popover/menu, toast, DOM/state change, network request, download;
- for `FAKE`, record that only a toast appeared;
- for destructive or irreversible actions, mark `NOT RUN` with the reason;
- close/restore after each click; never leave a modal open for the next row.

Verdicts: **PASS**, **DEAD**, **FAKE**, **NOT RUN**. NOT RUN is never a pass.

### 7. Report and fix

Write the map and the click report next to each other. Fix dead/fake rows, then re-run the map
and the click pass. A control is “working” only when the click produces the mapped effect on
the production build.

## Guardrails

- No cursor-only map. On the dashboard that overcounts 123 pointer elements to 27 controls.
- No handler-only map. It misses the hotel badge and the sidebar user row — both are
  supposed to be controls, both have no role, no handler, no focus and no pointer cursor.
- A toast is not an action.
- A handler-less `<button>` is still supposed to be clickable: it is DEAD, not static.
- Native date/time inputs are `INPUT`, not `DEAD`.
- A hidden control (mobile-only) is `NOT RUN` at desktop, not absent.

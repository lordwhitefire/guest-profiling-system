# How to find what is *supposed* to be clickable — findings

Probe date: 2026-11-12. Browser: the visible Chrome on CDP `127.0.0.1:9222`
(browser-attach). Site: production build on `http://localhost:3100`.

## The short answer

There is **no browser API that returns “supposed to be clickable.”** The browser exposes
four different truths, and they disagree:

| Signal | What it tells you | What it misses |
|---|---|---|
| **Accessibility tree** (role, name, focusable) | What assistive tech and role-based tools see | A `div` with an `onClick` can still be `StaticText`; a real `<button>` with no handler still has role `button` |
| **Native event listeners** (`getEventListeners`, CDP `DOMDebugger.getEventListeners`) | What is wired with `addEventListener` | React 17+ delegates events to the root, so a per-element scan can show nothing for a working React `onClick` |
| **React props** (`__reactProps$…` own property on the DOM node) | The actual `onClick`/`onChange`/`onSubmit` prop the component received | Internal React key, not a public contract; changes between versions |
| **Visual affordance** (`cursor:pointer`, hover, chevron, icon-only) | What a user will try to click | It is a hint, not behaviour — and an inert `div` may not even get `cursor:pointer` |

“Supposed to be clickable” is therefore a **product-intent** question. The defensible map is
the union of (a) semantics, (b) wiring, (c) visual affordance, and (d) the screen contract —
then every row is click-tested on the production build.

## What the sources say

- Chrome for Developers, *Full accessibility tree in Chrome DevTools* — the tree is derived
  from the DOM, with roles and names; it is how assistive tech sees the page.
  <https://developer.chrome.com/blog/full-accessibility-tree>
- ChromeDevTools issue #522 — dynamically clickable `div`s can appear as `StaticText` in the
  accessibility tree, so the AX tree alone will miss real controls.
  <https://github.com/ChromeDevTools/chrome-devtools-mcp/issues/522>
- Chrome for Developers, *Get and debug event listeners* — `getEventListeners(node)` / the
  Event Listeners panel show registered native listeners.
  <https://developer.chrome.com/blog/get-and-debug-event-listeners>
- React 17 changelog, *Changes to Event Delegation* — React attaches events at the root
  container, not on every element, so per-element listener scans under-report React handlers.
  <https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation>
- Playwright role locators / ARIA snapshots — role + accessible name is the stable way to
  address controls, and `ariaSnapshot()` prints what the page exposes.
  <https://playwright.dev/docs/locators#locate-by-role>
  <https://playwright.dev/docs/aria-snapshots>
- MDN, ARIA `button` role — a clickable `div` needs a role, a name, keyboard handling and
  `tabindex`; markup alone does not make it a control.
  <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role>

## Live findings from our app (port 9222, production build)

### 1. Cursor scanning overcounts badly

On `/workspace/dashboard`:

- 319 visible elements
- 123 elements with `cursor:pointer`
- only **27 actual control roots** (nearest element with a handler, `href`, native control
  semantics, or an interactive ARIA role)

96 of the 123 pointer elements are descendants (text spans, SVG paths, `rect`s) of a real
control. A cursor scan is not a map; it is a 4.5× overcount.

### 2. The two controls the owner noticed are invisible to every wiring scan

| Element | Markup | Harness | `tabIndex` | Cursor | AX snapshot |
|---|---|---|---|---|---|
| Hotel badge | `div.gps-hotel-badge` + ChevronDown | **no handler, no href** | -1 | auto | generic text + image |
| Sidebar user row | `div.gps-sidebar-user` + Ellipsis (three dots) | **no handler, no href** | -1 | auto | generic text + image |
| Topbar avatar | `button.gps-profile-button` + ChevronDown | `onClick` | 0 | pointer | `button "AO"` |
| Nav item | `a.gps-nav-item` | `href` + `onClick` | 0 | pointer | `link "Overview"` |

The first two *look* like controls because of the chevron/ellipsis, but they have no role, no
focusability, no handler, and not even `cursor:pointer`. No automated “find clickables” pass
will include them unless the **screen contract** says “this is the hotel switcher” and “this is
the user menu.” That is exactly why the map must be intent-led, not selector-led.

### 3. Native listener vs React prop

On the same page, CDP `DOMDebugger.getEventListeners`:

- `.gps-profile-button` → `click:bubble`
- `.gps-hotel-badge` → none
- `.gps-sidebar-user` → none

React’s own prop key on the DOM node (`__reactProps$…`) shows `onClick` on the profile button
and no handler on the two divs. This is the reliable “is it wired?” check in this React app.
Native listeners alone are not enough because React delegates at the root.

### 4. Control-root counts across 14 workspace routes

| Route | Visible | Control roots | Wired | Dead |
|---|---:|---:|---:|---:|
| dashboard | 319 | 27 | 27 | 0 |
| guest-search | 276 | 27 | 27 | 0 |
| directory | 689 | 88 | 66 | **22** |
| guest-profile | 223 | 23 | 23 | 0 |
| visit-history | 204 | 20 | 19 | **1** |
| registration | 84 | 13 | 10 | 3 (native date inputs, functional) |
| pms-sync | 302 | 21 | 21 | 0 |
| data-requests | 205 | 19 | 19 | 0 |
| audit-logs | 205 | 19 | 19 | 0 |
| users | 261 | 24 | 24 | 0 |
| tenants | 239 | 21 | 21 | 0 |
| settings | 215 | 30 | 29 | 1 (native text input, functional) |
| hotel-settings | 219 | 26 | 26 | 0 |
| analytics | 274 | 22 | 21 | **1** |

Real dead controls found by wiring:

- **Directory**: “Select all” + 21 row checkboxes — `input[type=checkbox]` with no handler.
- **Visit History**: period `<select>` (“All time / 2026 / 2025”) with no handler.
- **Analytics**: “Last 30 days” `<select>` with no handler.

Those are separate from the two inert sidebar affordances above.

### 5. Wired is not the same as working

The same map must record the **effect**. Many controls have a handler whose only effect is a
toast: Download Report, Save Defaults (topbar), Sync Now, Test Connection, Export, Edit Hotel
Information, profile tabs, View Sync Details. They pass a “has onClick” check and fail a
“does the thing” check. The click pass records route / modal / menu / network / toast, so a
toast-only action is visible as such.

## Consequence for the map

The clickability map will be built as:

1. **Route inventory** — all 20 pages (`/login`, `/design-system`, `/search`,
   `/profile/[guestId]`, 13 workspace pages, plus the two static state pages).
2. **Control rows** — nearest control roots (semantics/handler/href) **plus** declared
   affordances from the screen contract (hotel badge, user row, chevrons, icon-only).
3. **Per-row fields** — route, label, role, `tabIndex`, cursor, handler keys, `href`,
   expected effect, source of expectation (semantics / handler / affordance / contract).
4. **Click pass** — production build, each row: PASS / DEAD / FAKE / NOT RUN with evidence.

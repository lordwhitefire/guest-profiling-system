# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-13T09:47:07.510Z

## Counts

```
{
  "PASS": 130,
  "NOT RUN": 41,
  "FAKE": 6,
  "DEAD": 14,
  "NATIVE": 23
}
```

## FAKE (toast only)

- /search — Download Report — toast only: Report export is being prepared.
- /workspace/registration — Cancel — toast only; name field still "?"
- /workspace/registration — Complete Registration — toast only: Please complete the guest name and email fields.
- /workspace/settings — Cancel — toast only: Unsaved changes discarded.
- /workspace/error — Copy — toast only: Error reference copied.
- /workspace/dashboard — Sign out — navigates to /login but session cookie survives

## DEAD

- /search — Search — no state, route, network or download change
- /search — Clear search — no state, route, network or download change
- /workspace/dashboard — View Quick Guide — no state, route, network or download change
- /workspace/guest-search — Search — no state, route, network or download change
- /workspace/guest-search — Clear search — no state, route, network or download change
- /workspace/guest-search — Clear search — no state, route, network or download change
- /workspace/directory — Filters — no state, route, network or download change
- /workspace/directory — 3 — no state, route, network or download change
- /workspace/directory — (icon) — no state, route, network or download change
- /workspace/users — View permissions — no state, route, network or download change
- /workspace/users — View permissions — no state, route, network or download change
- /workspace/settings — Save Changes — no state, route, network or download change
- /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 — Reload — request failed: GET /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023? 500
- /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 — Back — request failed: GET /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 500

## NOT RUN

- /search — Search guests, properties, users... — editable input
- /workspace/guest-profile — AD — not found in live DOM
- /design-system — Primary — design-system demo
- /design-system — Secondary — design-system demo
- /design-system — Ghost — design-system demo
- /design-system — Destructive — design-system demo
- /design-system — you@example.com — editable input
- /design-system — +234 800 000 0000 — editable input
- /design-system — Not editable — disabled
- /search — Enter guest name, phone number or email... — editable input
- /workspace/dashboard — View Omar Al-Hassan — not found in live DOM
- /workspace/dashboard — View Khan — not found in live DOM
- /workspace/guest-search — Enter guest name, phone number or email... — editable input
- /workspace/directory — Search guest name, email or phone... — editable input
- /workspace/directory — Select Chidi Dauda — not found in live DOM
- /workspace/directory — (icon) — disabled
- /workspace/directory — 1 — disabled
- /workspace/guest-profile — Go to directory — not found in live DOM
- /workspace/registration — Start typing to find a returning guest — editable input
- /workspace/registration — guest@email.com — editable input
- /workspace/registration — +234 000 000 0000 — editable input
- /workspace/registration — (icon) — editable input
- /workspace/registration — (icon) — editable input
- /workspace/pms-sync — Refreshing… — disabled
- /workspace/users — Edit receptionist@grandvista.test — not found in live DOM
- /workspace/settings — (icon) — editable input
- /workspace/analytics — Last 30 days — single option; cannot change
- /login — you@hotel.com — editable input
- /login — Enter your password — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — Save — submitting creates a record; tested in phase 4 with disposable data
- /workspace/data-requests — guest@example.com — editable input
- /workspace/data-requests — What should be done? — editable input
- /workspace/data-requests — Save — submitting creates a record; tested in phase 4 with disposable data
- /workspace/users — name@hotel.com — editable input
- /workspace/users — At least 8 characters — editable input
- /workspace/users — Save — submitting creates a record; tested in phase 4 with disposable data
- /login — (icon) — editable input

## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
| /search | shell | Guest Profiling System | WIRED (href) | **PASS** | self-link: already on /workspace/dashboard |
| /search | shell | Overview | WIRED (href) | **PASS** | self-link: already on /workspace/dashboard |
| /search | shell | Guest Search | WIRED (href) | **PASS** | navigation: /workspace/guest-search |
| /search | shell | Guest Directory | WIRED (href) | **PASS** | navigation: /workspace/directory |
| /search | shell | Guest History | WIRED (href) | **PASS** | navigation: /workspace/visit-history |
| /search | shell | Registration | WIRED (href) | **PASS** | navigation: /workspace/registration |
| /search | shell | Administration | WIRED (href) | **PASS** | navigation: /workspace/analytics |
| /search | shell | PMS Integration | WIRED (href) | **PASS** | navigation: /workspace/pms-sync |
| /search | shell | Tenants | WIRED (href) | **PASS** | navigation: /workspace/tenants |
| /search | shell | Users & Roles | WIRED (href) | **PASS** | navigation: /workspace/users |
| /search | shell | Data Requests | WIRED (href) | **PASS** | navigation: /workspace/data-requests |
| /search | shell | Audit Logs | WIRED (href) | **PASS** | navigation: /workspace/audit-logs |
| /search | shell | Settings | WIRED (href) | **PASS** | navigation: /workspace/settings |
| /search | shell | Grand Vista Hotel Hotel workspace | WIRED (handler) | **PASS** | opens a modal |
| /search | shell | AD Admin Administrator | WIRED (handler) | **PASS** | opens a modal |
| /search | shell | Search guests, properties, users... | WIRED (handler) | **NOT RUN** | editable input |
| /search | shell | Download Report | WIRED (handler) | **FAKE** | toast only: Report export is being prepared. |
| /search | shell | Notifications | WIRED (handler) | **PASS** | opens a popover |
| /search | shell | AD | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | shell | Grand Vista Hotel Hotel workspace | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | shell | AD Admin Administrator | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | shell | AD | WIRED (handler) | **NOT RUN** | not found in live DOM |
| shell | notifications | Close | WIRED (handler) | **PASS** | popover closes |
| /design-system | page | Primary | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Secondary | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Ghost | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Destructive | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | you@example.com | INPUT | **NOT RUN** | editable input |
| /design-system | page | +234 800 000 0000 | INPUT | **NOT RUN** | editable input |
| /design-system | page | Not editable | DISABLED | **NOT RUN** | disabled |
| /search | page | Enter guest name, phone number or email... | WIRED (handler) | **NOT RUN** | editable input |
| /search | page | Search | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /search | page | Clear search | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /search | page | Clear search | WIRED (handler) | **PASS** | network: GET /api/health 200; GET /api/sync-status 200 |
| /workspace/dashboard | page | Search for a guest | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/dashboard | page | Quick Search | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/directory |
| /workspace/dashboard | page | View Loop Tester Two | WIRED (handler) | **PASS** | opens a modal |
| /workspace/dashboard | page | View Funke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/dashboard | page | View Omar Al-Hassan | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View Khan | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/audit-logs |
| /workspace/dashboard | page | View Sync Details | WIRED (handler) | **PASS** | navigation: /workspace/pms-sync |
| /workspace/dashboard | page | View Quick Guide | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/guest-search | page | Enter guest name, phone number or email... | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/guest-search | page | Search | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/guest-search | page | Clear search | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/guest-search | page | Clear search | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/directory | page | Add Guest | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Export | WIRED (handler) | **PASS** | download: directory-11111111-1111-1111-1111-111111111111-2026-11-13.csv |
| /workspace/directory | page | Search guest name, email or phone... | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | page | All VIP Returning New | WIRED (handler) | **PASS** | row list changed (20 -> 0) |
| /workspace/directory | page | Filters | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/directory | page | Select all | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | Select Loop Tester Two | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Loop Tester Two | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Funke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Funke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Omar Al-Hassan | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Omar Al-Hassan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Khan | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Khan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Ibrahim Davis | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Ibrahim Davis | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Yuki Mohammed | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Yuki Mohammed | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Jennifer Adeyemi | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Jennifer Adeyemi | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Arjun Okafor | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Arjun Okafor | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Ngozi Garcia | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Ngozi Garcia | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Chukwuemeka Mohammed | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Chukwuemeka Mohammed | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Wei Williams | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Wei Williams | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Linda Kumar | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Linda Kumar | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Aisha Bello | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Aisha Bello | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select David Dauda | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit David Dauda | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select John Al-Hassan | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit John Al-Hassan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Michael Johnson | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Michael Johnson | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Chidi Dauda | NATIVE (no state wiring) | **NOT RUN** | not found in live DOM |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Chidi Dauda | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Zainab Adeleke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Zainab Adeleke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Obinna Sani | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Obinna Sani | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Kunle Patel | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Kunle Patel | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | DISABLED | **NOT RUN** | disabled |
| /workspace/directory | page | 1 | DISABLED | **NOT RUN** | disabled |
| /workspace/directory | page | 2 | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=20 200; GET /api/data-requests?page=1&limit=20 200 |
| /workspace/directory | page | 3 | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/directory | page | (icon) | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/guest-profile | page | Go to directory | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/visit-history | page | Export History | WIRED (handler) | **PASS** | download: visit-history-fd208c07-7f5d-4f84-b23e-520c1bab8911-2026-11-13.csv |
| /workspace/visit-history | page | All time 2026 2025 | NATIVE (no effect) | **NATIVE** | select changed All time -> 2026; no data effect |
| /workspace/registration | page | Hotel PMS | WIRED (handler) | **PASS** | navigation: /workspace/pms-sync |
| /workspace/registration | page | Start typing to find a returning guest | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | guest@email.com | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | +234 000 000 0000 | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | Select room type Deluxe Room Executive Suite Standard Room | WIRED (handler) | **PASS** | room select changed  -> Deluxe Room |
| /workspace/registration | page | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | (icon) | WIRED (handler) | **NATIVE** | confirmation checkbox toggles; not connected to submit |
| /workspace/registration | page | Cancel | WIRED (handler) | **FAKE** | toast only; name field still "?" |
| /workspace/registration | page | Complete Registration | WIRED (handler) | **FAKE** | toast only: Please complete the guest name and email fields. |
| /workspace/pms-sync | page | Sync Now | WIRED (handler) | **PASS** | network: POST /api/sync-status/now 200; GET /api/guests?page=1&limit=20 200 |
| /workspace/pms-sync | page | Test Connection | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=1 200; GET /api/tenants 200 |
| /workspace/pms-sync | page | Refreshing… | DISABLED | **NOT RUN** | disabled |
| /workspace/data-requests | page | New Request | WIRED (handler) | **PASS** | network: GET /api/stats 200; GET /api/auth/me 200 |
| /workspace/data-requests | page | New Request | WIRED (handler) | **PASS** | opens a modal |
| /workspace/audit-logs | page | Export | WIRED (handler) | **PASS** | network: GET /api/export/audit-logs 200; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mweseubt-19"]')[22m
 |
| /workspace/audit-logs | page | Export Logs | WIRED (handler) | **PASS** | network: GET /api/audit-logs?page=1&limit=20 200; GET /api/export/audit-logs 200; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwesfcmj-20"]')[22m
 |
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | Edit receptionist@grandvista.test | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/users | page | Edit admin@grandvista.test | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/users | page | View permissions | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/users | page | View permissions | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/users | page | View permissions | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/tenants | page | Add Hotel | WIRED (handler) | **PASS** | opens a modal |
| /workspace/tenants | page | Add tenant | WIRED (handler) | **PASS** | opens a modal |
| /workspace/tenants | page | Manage Hotel Settings | WIRED (handler) | **PASS** | navigation: /workspace/hotel-settings |
| /workspace/settings | page | Save Defaults | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=20 200 |
| /workspace/settings | page | Dismiss notice | WIRED (handler) | **PASS** | network: GET /api/analytics/activity?days=30 200; GET /api/guests?page=1&limit=20 200 |
| /workspace/settings | page | General | WIRED (handler) | **PASS** | network: GET /api/stats 200; GET /api/sync-status 200 |
| /workspace/settings | page | Notifications | WIRED (handler) | **PASS** | network: GET /api/health 200; GET /api/settings 200 |
| /workspace/settings | page | Security | WIRED (handler) | **PASS** | network: GET /api/health 200; GET /api/guests?page=1&limit=20 200 |
| /workspace/settings | page | Integrations | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | Account | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | (icon) | INPUT | **NOT RUN** | editable input |
| /workspace/settings | page | English (United States) English (United Kingdom) | WIRED (handler) | **PASS** | select changed en-US -> en-GB (state change; Save still required) |
| /workspace/settings | page | Africa/Lagos (WAT) UTC | WIRED (handler) | **PASS** | select changed Africa/Lagos -> UTC (state change; Save still required) |
| /workspace/settings | page | DD/MM/YYYY MM/DD/YYYY | WIRED (handler) | **PASS** | select changed DD/MM/YYYY -> MM/DD/YYYY (state change; Save still required) |
| /workspace/settings | page | Cancel | WIRED (handler) | **FAKE** | toast only: Unsaved changes discarded. |
| /workspace/settings | page | Save Changes | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/hotel-settings | page | Edit Hotel Information | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/hotel-settings | page | (icon) | WIRED (handler) | **PASS** | switch state "gps-switch " -> "gps-switch on" |
| /workspace/hotel-settings | page | (icon) | WIRED (handler) | **PASS** | switch state "gps-switch " -> "gps-switch on" |
| /workspace/hotel-settings | page | 90 days 1 year 3 years 7 years | WIRED (handler) | **PASS** | select changed 365 -> 90 (state change; Save still required) |
| /workspace/hotel-settings | page | English (United States) English (United Kingdom) | WIRED (handler) | **PASS** | select changed en-US -> en-GB (state change; Save still required) |
| /workspace/hotel-settings | page | Africa/Lagos (WAT) UTC | WIRED (handler) | **PASS** | select changed Africa/Lagos -> UTC (state change; Save still required) |
| /workspace/hotel-settings | page | Strict — exact fields only Balanced — phone, email and name Loose — include simi | WIRED (handler) | **PASS** | select changed balanced -> strict (state change; Save still required) |
| /workspace/hotel-settings | page | Every 15 minutes Every 30 minutes Hourly | WIRED (handler) | **PASS** | select changed 15 -> 30 (state change; Save still required) |
| /workspace/hotel-settings | page | Save Settings | WIRED (handler) | **PASS** | network: PUT /api/settings 200 |
| /workspace/analytics | page | Last 30 days | NATIVE (no effect) | **NOT RUN** | single option; cannot change |
| /workspace/analytics | page | Guest Directory | WIRED (handler) | **PASS** | navigation: /workspace/directory |
| /workspace/analytics | page | PMS Integration | WIRED (handler) | **PASS** | navigation: /workspace/pms-sync |
| /workspace/analytics | page | User Management | WIRED (handler) | **PASS** | navigation: /workspace/users |
| /workspace/analytics | page | System Settings | WIRED (handler) | **PASS** | navigation: /workspace/settings |
| /workspace/error | page | Copy | WIRED (handler) | **FAKE** | toast only: Error reference copied. |
| /workspace/error | page | Try Again | WIRED (handler) | **PASS** | network: GET /workspace/error 200 |
| /workspace/error | page | Go to Guest Search | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/error | page | Return to Dashboard | WIRED (handler) | **PASS** | navigation: /workspace/dashboard |
| /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | page | Reload | WIRED (form submit) | **DEAD** | request failed: GET /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023? 500 |
| /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | page | Back | WIRED (handler) | **DEAD** | request failed: GET /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 500 |
| /login | page | you@hotel.com | WIRED (handler) | **NOT RUN** | editable input |
| /login | page | Enter your password | WIRED (handler) | **NOT RUN** | editable input |
| /login | page | Show password | WIRED (handler) | **PASS** | password field type password -> text |
| /login | page | (icon) | WIRED (handler) | **NATIVE** | checkbox toggles visually; no app state |
| /login | page | Forgot password? | WIRED (handler) | **PASS** | opens a modal |
| /login | page | Sign In → | WIRED (form submit) | **PASS** | login request submitted and rejected: 401 |
| /login | page | Secure Sign-In · Your data is safe with us | WIRED (handler) | **PASS** | error/notice shown: Single sign-on is not configured for this workspace. |
| /login | page | Terms of Service | WIRED (href) | **PASS** | opens a modal |
| /login | page | Privacy Policy | WIRED (href) | **PASS** | opens a modal |
| /workspace/directory | add-guest | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/data-requests | new-request | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/data-requests | new-request | guest@example.com | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/data-requests | new-request | Data Access Data Export Correction Deletion | WIRED (handler) | **PASS** | select changed ACCESS -> EXPORT (state change) |
| /workspace/data-requests | new-request | What should be done? | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/data-requests | new-request | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/data-requests | new-request | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/users | invite-user | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/users | invite-user | name@hotel.com | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/users | invite-user | At least 8 characters | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/users | invite-user | Receptionist Hotel Manager Administrator | WIRED (handler) | **PASS** | select changed Receptionist -> RegionalManager (state change) |
| /workspace/users | invite-user | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/users | invite-user | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/dashboard | account-menu | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Account settings | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Sign out | WIRED (handler) | **FAKE** | navigates to /login but session cookie survives |
| /login | page | (icon) | WIRED (handler) | **NOT RUN** | editable input |

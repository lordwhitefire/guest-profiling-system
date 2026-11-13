# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-13T11:53:24.308Z

## Counts

```
{
  "PASS": 158,
  "NOT RUN": 37,
  "NATIVE": 24,
  "FAKE": 1
}
```

## FAKE (toast only)

- /workspace/dashboard — Sign out — /api/auth/me 401; dashboard still signed in

## DEAD


## NOT RUN

- /search — Search guests, properties, users... — editable input
- /design-system — Primary — design-system demo
- /design-system — Secondary — design-system demo
- /design-system — Ghost — design-system demo
- /design-system — Destructive — design-system demo
- /design-system — you@example.com — editable input
- /design-system — +234 800 000 0000 — editable input
- /design-system — Not editable — disabled
- /search — Enter guest name, phone number or email... — editable input
- /workspace/guest-search — Enter guest name, phone number or email... — editable input
- /workspace/directory — Search guest name, email or phone... — editable input
- /workspace/directory — Previous page — disabled
- /workspace/directory — 1 — disabled
- /workspace/guest-profile — Prepare Registration — extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again.
- /workspace/visit-history — All time 2026 — not found in live DOM
- /workspace/registration — Start typing to find a returning guest — editable input
- /workspace/registration — guest@email.com — editable input
- /workspace/registration — +234 000 000 0000 — editable input
- /workspace/registration — (icon) — editable input
- /workspace/registration — (icon) — editable input
- /workspace/pms-sync — Refreshing… — disabled
- /workspace/settings — (icon) — editable input
- /workspace/analytics — Last 30 days — single option; cannot change
- /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 — Fill registration form — extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again.
- /login — you@hotel.com — editable input
- /login — Enter your password — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — Save — submitting creates a record; tested in phase 4 with disposable data
- /workspace/users — name@hotel.com — editable input
- /workspace/users — At least 8 characters — editable input
- /workspace/users — Save — submitting creates a record; tested in phase 4 with disposable data
- /workspace/tenants — e.g. Lakeside Suites — editable input
- /workspace/tenants — Save — submitting creates a record; tested in phase 4 with disposable data
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
| /search | shell | Download Report | WIRED (handler) | **PASS** | download: directory-11111111-1111-1111-1111-111111111111-2026-11-13.csv |
| /search | shell | Notifications | WIRED (handler) | **PASS** | opens a popover |
| /search | shell | AD | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | shell | AD Admin Administrator | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | shell | AD | WIRED (handler) | **PASS** | opens a modal |
| /workspace/pms-sync | shell | Grand Vista Hotel Hotel workspace | WIRED (handler) | **PASS** | opens a modal |
| shell | notifications | Close | WIRED (handler) | **PASS** | popover closes |
| /design-system | page | Primary | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Secondary | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Ghost | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Destructive | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | you@example.com | INPUT | **NOT RUN** | editable input |
| /design-system | page | +234 800 000 0000 | INPUT | **NOT RUN** | editable input |
| /design-system | page | Not editable | DISABLED | **NOT RUN** | disabled |
| /search | page | Enter guest name, phone number or email... | WIRED (handler) | **NOT RUN** | editable input |
| /search | page | Search | WIRED (handler) | **PASS** | search request: GET /api/guests/search?q=loop |
| /search | page | Clear search | WIRED (handler) | **PASS** | query cleared "loop" -> "" |
| /search | page | Clear search | WIRED (handler) | **PASS** | query cleared "loop" -> "" |
| /workspace/dashboard | page | Search for a guest | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/dashboard | page | Quick Search | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/directory |
| /workspace/dashboard | page | View Loop Tester Two | WIRED (handler) | **PASS** | opens a modal |
| /workspace/dashboard | page | View Funke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/dashboard | page | View Omar Al-Hassan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/dashboard | page | View Khan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/audit-logs |
| /workspace/dashboard | page | View Sync Details | WIRED (handler) | **PASS** | navigation: /workspace/pms-sync |
| /workspace/dashboard | page | View Quick Guide | WIRED (handler) | **PASS** | content expanded (1075 -> 1422) |
| /workspace/guest-search | page | Enter guest name, phone number or email... | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/guest-search | page | Search | WIRED (handler) | **PASS** | search request: GET /api/guests/search?q=loop |
| /workspace/guest-search | page | Clear search | WIRED (handler) | **PASS** | query cleared "loop" -> "" |
| /workspace/guest-search | page | Clear search | WIRED (handler) | **PASS** | query cleared "loop" -> "" |
| /workspace/directory | page | Add Guest | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Export | WIRED (handler) | **PASS** | download: directory-11111111-1111-1111-1111-111111111111-2026-11-13.csv |
| /workspace/directory | page | Search guest name, email or phone... | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | page | All VIP Returning New | WIRED (handler) | **PASS** | row list changed (20 -> 0) |
| /workspace/directory | page | Filters | WIRED (handler) | **PASS** | filter VIP -> All, query -> "" |
| /workspace/directory | page | Select all | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | Select Loop Tester Two | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Loop Tester Two | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Loop Tester Two | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Funke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Funke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Funke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Omar Al-Hassan | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Omar Al-Hassan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Omar Al-Hassan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Khan | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Khan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Khan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Ibrahim Davis | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Ibrahim Davis | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Ibrahim Davis | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Yuki Mohammed | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Yuki Mohammed | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Yuki Mohammed | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Jennifer Adeyemi | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Jennifer Adeyemi | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Jennifer Adeyemi | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Arjun Okafor | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Arjun Okafor | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Arjun Okafor | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Ngozi Garcia | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Ngozi Garcia | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Ngozi Garcia | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Chukwuemeka Mohammed | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Chukwuemeka Mohammed | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Chukwuemeka Mohammed | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Wei Williams | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Wei Williams | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Wei Williams | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Linda Kumar | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Linda Kumar | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Linda Kumar | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Aisha Bello | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Aisha Bello | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Aisha Bello | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select David Dauda | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View David Dauda | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit David Dauda | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select John Al-Hassan | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View John Al-Hassan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit John Al-Hassan | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Michael Johnson | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Michael Johnson | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Michael Johnson | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Chidi Dauda | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Chidi Dauda | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Chidi Dauda | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Zainab Adeleke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Zainab Adeleke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Zainab Adeleke | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Obinna Sani | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Obinna Sani | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Obinna Sani | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Select Kunle Patel | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | View Kunle Patel | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Edit Kunle Patel | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Previous page | DISABLED | **NOT RUN** | disabled |
| /workspace/directory | page | 1 | DISABLED | **NOT RUN** | disabled |
| /workspace/directory | page | 2 | WIRED (handler) | **PASS** | page 2 (GET 200) |
| /workspace/directory | page | 3 | WIRED (handler) | **PASS** | page 3 (GET 200) |
| /workspace/directory | page | Next page | WIRED (handler) | **PASS** | network: GET /api/guests?page=2&limit=20 200 |
| /workspace/guest-profile | page | Edit Profile | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | page | Prepare Registration | WIRED (handler) | **NOT RUN** | extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again. |
| /workspace/guest-profile | page | Overview | WIRED (handler) | **PASS** | already active: Overview |
| /workspace/guest-profile | page | Visit History | WIRED (handler) | **PASS** | network: GET /api/guests/fd208c07-7f5d-4f84-b23e-520c1bab8911/visits?limit=100 200 |
| /workspace/guest-profile | page | Preferences | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/guest-profile | page | Activity | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/visit-history | page | Export History | WIRED (handler) | **PASS** | download: visit-history-fd208c07-7f5d-4f84-b23e-520c1bab8911-2026-11-13.csv |
| /workspace/visit-history | page | All time 2026 | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/registration | page | Hotel PMS | WIRED (handler) | **PASS** | navigation: /workspace/pms-sync |
| /workspace/registration | page | Start typing to find a returning guest | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | guest@email.com | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | +234 000 000 0000 | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | Select room type Deluxe Room Executive Suite Standard Room | WIRED (handler) | **PASS** | room select changed  -> Deluxe Room |
| /workspace/registration | page | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | (icon) | WIRED (handler) | **PASS** | guarded submit: Please confirm the guest information has been reviewed. |
| /workspace/registration | page | Cancel | WIRED (handler) | **PASS** | form fields reset |
| /workspace/registration | page | Complete Registration | WIRED (handler) | **PASS** | validation guard fired, no PMS row written: Please complete the guest name and email fields. |
| /workspace/pms-sync | page | Sync Now | WIRED (handler) | **PASS** | network: POST /api/sync-status/now 200; GET /api/guests?page=1&limit=20 200 |
| /workspace/pms-sync | page | Test Connection | WIRED (handler) | **PASS** | POST /api/sync-status/test 200 |
| /workspace/pms-sync | page | Refreshing… | DISABLED | **NOT RUN** | disabled |
| /workspace/data-requests | page | New Request | WIRED (handler) | **PASS** | opens a modal |
| /workspace/data-requests | page | New Request | WIRED (handler) | **PASS** | opens a modal |
| /workspace/audit-logs | page | Export | WIRED (handler) | **PASS** | download: audit-logs-11111111-1111-1111-1111-111111111111-2026-11-13.csv; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwewwe1i-19"]')[22m
 |
| /workspace/audit-logs | page | Export Logs | WIRED (handler) | **PASS** | download: audit-logs-11111111-1111-1111-1111-111111111111-2026-11-13.csv; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwewx08w-20"]')[22m
 |
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | Edit receptionist@grandvista.test | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/users | page | Edit admin@grandvista.test | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/users | page | View permissions | WIRED (handler) | **PASS** | content expanded (554 -> 715) |
| /workspace/users | page | View permissions | WIRED (handler) | **PASS** | content expanded (554 -> 674) |
| /workspace/users | page | View permissions | WIRED (handler) | **PASS** | content expanded (554 -> 660) |
| /workspace/tenants | page | Add Hotel | WIRED (handler) | **PASS** | opens a modal |
| /workspace/tenants | page | Add tenant | WIRED (handler) | **PASS** | opens a modal |
| /workspace/tenants | page | Switch to Grand Vista Hotel | WIRED (handler) | **PASS** | network: POST /api/auth/switch-tenant 200; GET /workspace/tenants 200 |
| /workspace/tenants | page | Manage Hotel Settings | WIRED (handler) | **PASS** | navigation: /workspace/hotel-settings |
| /workspace/settings | page | Save Defaults | WIRED (handler) | **PASS** | PUT /api/settings 200 |
| /workspace/settings | page | Dismiss notice | WIRED (handler) | **PASS** | notice banner removed |
| /workspace/settings | page | General | WIRED (handler) | **PASS** | already active: General |
| /workspace/settings | page | Notifications | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | Security | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | Integrations | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | Account | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | (icon) | INPUT | **NOT RUN** | editable input |
| /workspace/settings | page | English (United States) English (United Kingdom) | WIRED (handler) | **PASS** | select changed en-US -> en-GB (state change; Save still required) |
| /workspace/settings | page | Africa/Lagos (WAT) UTC | WIRED (handler) | **PASS** | select changed Africa/Lagos -> UTC (state change; Save still required) |
| /workspace/settings | page | DD/MM/YYYY MM/DD/YYYY | WIRED (handler) | **PASS** | select changed DD/MM/YYYY -> MM/DD/YYYY (state change; Save still required) |
| /workspace/settings | page | Cancel | WIRED (handler) | **PASS** | discarded en-GB, restored en-US |
| /workspace/settings | page | Save Changes | WIRED (handler) | **PASS** | PUT 200 and persisted en-US -> en-GB |
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
| /workspace/error | page | Copy | WIRED (handler) | **PASS** | clipboard: "GP-0017 · 11NOV26-0942" |
| /workspace/error | page | Try Again | WIRED (handler) | **PASS** | network: GET /workspace/error 200; GET /api/tenants 200 |
| /workspace/error | page | Go to Guest Search | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/error | page | Return to Dashboard | WIRED (handler) | **PASS** | navigation: /workspace/dashboard |
| /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | page | ← Back to search | WIRED (href) | **PASS** | navigation: /workspace/guest-search |
| /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | page | task009.loop@example.com | WIRED (href) | **NATIVE** | external mail/tel link; not clicked (OS handler) |
| /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | page | 2347003334444 | WIRED (href) | **NATIVE** | external mail/tel link; not clicked (OS handler) |
| /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | page | Fill registration form | WIRED (handler) | **NOT RUN** | extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again. |
| /login | page | you@hotel.com | WIRED (handler) | **NOT RUN** | editable input |
| /login | page | Enter your password | WIRED (handler) | **NOT RUN** | editable input |
| /login | page | Show password | WIRED (handler) | **PASS** | password field type password -> text |
| /login | page | (icon) | WIRED (handler) | **NATIVE** | checkbox toggles visually; no app state |
| /login | page | Forgot password? | WIRED (handler) | **PASS** | opens a modal |
| /login | page | Sign In → | WIRED (form submit) | **PASS** | login request submitted and rejected: 401 |
| /login | page | Secure Sign-In · Your data is safe with us | WIRED (handler) | **PASS** | content expanded (686 -> 738) |
| /login | page | Terms of Service | WIRED (href) | **PASS** | opens a modal |
| /login | page | Privacy Policy | WIRED (href) | **PASS** | opens a modal |
| /workspace/directory | add-guest | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/users | invite-user | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/users | invite-user | name@hotel.com | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/users | invite-user | At least 8 characters | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/users | invite-user | Receptionist Hotel Manager Administrator | WIRED (handler) | **PASS** | select changed Receptionist -> RegionalManager (state change) |
| /workspace/users | invite-user | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/users | invite-user | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/tenants | add-hotel | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/tenants | add-hotel | e.g. Lakeside Suites | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/tenants | add-hotel | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/tenants | add-hotel | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/dashboard | account-menu | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Account settings | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Sign out | WIRED (handler) | **FAKE** | /api/auth/me 401; dashboard still signed in |
| /login | page | (icon) | WIRED (handler) | **NOT RUN** | editable input |

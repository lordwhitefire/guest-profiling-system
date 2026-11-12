# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-12T16:43:08.091Z

## Counts

```
{
  "PASS": 122,
  "DEAD": 17,
  "NOT RUN": 46,
  "FAKE": 37,
  "NATIVE": 23
}
```

## FAKE (toast only)

- /search — Search — toast only: Guest search refreshed.
- /workspace/dashboard — View Sync Details — toast only: Opening PMS synchronisation details.
- /workspace/dashboard — View Quick Guide — toast only: Quick guide opened.
- /workspace/guest-search — Search — toast only: Guest search refreshed.
- /workspace/directory — All VIP Returning New — selection changes but the list does not
- /workspace/directory — (icon) — toast only: Editing Arjun Okafor.
- /workspace/directory — (icon) — toast only: Editing Ngozi Garcia.
- /workspace/directory — (icon) — toast only: Editing Chukwuemeka Mohammed.
- /workspace/directory — (icon) — toast only: Editing Wei Williams.
- /workspace/directory — (icon) — toast only: Editing Linda Kumar.
- /workspace/directory — (icon) — toast only: Editing Aisha Bello.
- /workspace/directory — (icon) — toast only: Editing David Dauda.
- /workspace/directory — (icon) — toast only: Editing John Al-Hassan.
- /workspace/directory — (icon) — toast only: Editing Michael Johnson.
- /workspace/directory — (icon) — toast only: Editing Chidi Dauda.
- /workspace/directory — (icon) — toast only: Editing Zainab Adeleke.
- /workspace/directory — (icon) — toast only: Editing Obinna Sani.
- /workspace/directory — (icon) — toast only: Editing Kunle Patel.
- /workspace/directory — (icon) — toast only: Editing Funke.
- /workspace/directory — (icon) — toast only: Editing Emeka Yusuf.
- /workspace/directory — (icon) — toast only: Editing Seyi Davis.
- /workspace/guest-profile — Overview — toast only: Overview tab selected.
- /workspace/registration — Hotel PMS — toast only: Hotel PMS home opened.
- /workspace/registration — Complete Registration — toast only: Guest details prepared. Complete registration in the hotel PMS.
- /workspace/pms-sync — Test Connection — toast only: Connection test successful.
- /workspace/audit-logs — Export — toast only: Audit log export started.
- /workspace/audit-logs — Export Logs — toast only: Audit logs export started.
- /workspace/users — (icon) — toast only: Editing receptionist@grandvista.test.
- /workspace/users — View permissions — toast only: Administrator permissions opened.
- /workspace/users — View permissions — toast only: Regional Manager permissions opened.
- /workspace/users — View permissions — toast only: Receptionist permissions opened.
- /workspace/settings — Save Defaults — toast only: Settings saved successfully.
- /workspace/settings — (icon) — toast only: Settings notice dismissed.
- /workspace/hotel-settings — Edit Hotel Information — toast only: Hotel information editor opened.
- /workspace/error — Copy — toast only: Error reference copied.
- /workspace/error — Try Again — toast only: Retrying your request...
- /workspace/dashboard — Sign out — navigates to /login but session cookie survives

## DEAD

- shell — Registration — no state, route, network or download change
- shell — PMS Integration — no state, route, network or download change
- shell — Tenants — no state, route, network or download change
- shell — Users & Roles — no state, route, network or download change
- shell — Data Requests — no state, route, network or download change
- shell — Audit Logs — no state, route, network or download change
- shell — Settings — no state, route, network or download change
- shell — Grand Vista Hotel + chevron — no role, handler, focus, route, popover or toast
- shell — Admin Operator + three dots — no role, handler, focus, route, popover or toast
- /search — Retry — no state, route, network or download change
- /workspace/guest-search — Retry — no state, route, network or download change
- /workspace/guest-search — Clear search — no state, route, network or download change
- /workspace/directory — Filters — no state, route, network or download change
- /workspace/directory — (icon) — no state, route, network or download change
- /workspace/settings — Cancel — request failed: GET /api/sync-status 500
- /workspace/hotel-settings — Save Settings — no state, route, network or download change
- /login — Contact hotel administrator — no state, route, network or download change

## NOT RUN

- shell — Search guests, properties, users... — editable input
- /design-system — Primary — design-system demo
- /design-system — Secondary — design-system demo
- /design-system — Ghost — design-system demo
- /design-system — Destructive — design-system demo
- /design-system — you@example.com — editable input
- /design-system — +234 800 000 0000 — editable input
- /design-system — Not editable — disabled
- /search — Enter guest name, phone number or email... — editable input
- /workspace/dashboard — View Jennifer Adeyemi — not found in live DOM
- /workspace/dashboard — View Arjun Okafor — not found in live DOM
- /workspace/dashboard — View Ngozi Garcia — not found in live DOM
- /workspace/dashboard — View Chukwuemeka Mohammed — not found in live DOM
- /workspace/guest-search — Enter guest name, phone number or email... — editable input
- /workspace/directory — Search guest name, email or phone... — editable input
- /workspace/directory — (icon) — not found in live DOM
- /workspace/directory — Select Edge ZeroDate — not found in live DOM
- /workspace/directory — (icon) — disabled
- /workspace/guest-profile — Prepare Registration — extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again.
- /workspace/visit-history — Refresh — not found in live DOM
- /workspace/registration — Enter guest full name — editable input
- /workspace/registration — guest@email.com — editable input
- /workspace/registration — +234 000 000 0000 — editable input
- /workspace/registration — (icon) — editable input
- /workspace/registration — (icon) — editable input
- /workspace/pms-sync — Retry — not found in live DOM
- /workspace/users — (icon) — not found in live DOM
- /workspace/tenants — (icon) — not found in live DOM
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
- /workspace/tenants — e.g. Lakeside Suites — editable input
- /workspace/tenants — Save — submitting creates a record; tested in phase 4 with disposable data
- /login — (icon) — editable input

## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
| shell | shell | Guest Profiling System | WIRED (href) | **PASS** | self-link: already on /workspace/dashboard |
| shell | shell | Overview | WIRED (href) | **PASS** | self-link: already on /workspace/dashboard |
| shell | shell | Guest Search | WIRED (href) | **PASS** | navigation: /workspace/guest-search |
| shell | shell | Guest Directory | WIRED (href) | **PASS** | navigation: /workspace/directory |
| shell | shell | Guest History | WIRED (href) | **PASS** | network: GET /api/guests?page=1&limit=1 200 |
| shell | shell | Registration | WIRED (href) | **DEAD** | no state, route, network or download change |
| shell | shell | Administration | WIRED (href) | **PASS** | navigation: /workspace/analytics |
| shell | shell | PMS Integration | WIRED (href) | **DEAD** | no state, route, network or download change |
| shell | shell | Tenants | WIRED (href) | **DEAD** | no state, route, network or download change |
| shell | shell | Users & Roles | WIRED (href) | **DEAD** | no state, route, network or download change |
| shell | shell | Data Requests | WIRED (href) | **DEAD** | no state, route, network or download change |
| shell | shell | Audit Logs | WIRED (href) | **DEAD** | no state, route, network or download change |
| shell | shell | Settings | WIRED (href) | **DEAD** | no state, route, network or download change |
| shell | shell | Search guests, properties, users... | WIRED (handler) | **NOT RUN** | editable input |
| shell | shell | Download Report | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=20 200; GET /api/guests?page=1&limit=1 200 |
| shell | shell | Notifications | WIRED (handler) | **PASS** | opens a popover |
| shell | shell | AO | WIRED (handler) | **PASS** | opens a modal |
| shell | contract | Grand Vista Hotel + chevron | DEAD (contract) | **DEAD** | no role, handler, focus, route, popover or toast |
| shell | contract | Admin Operator + three dots | DEAD (contract) | **DEAD** | no role, handler, focus, route, popover or toast |
| shell | notifications | Close | WIRED (handler) | **PASS** | popover closes |
| /design-system | page | Primary | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Secondary | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Ghost | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | Destructive | STATIC (demo) | **NOT RUN** | design-system demo |
| /design-system | page | you@example.com | INPUT | **NOT RUN** | editable input |
| /design-system | page | +234 800 000 0000 | INPUT | **NOT RUN** | editable input |
| /design-system | page | Not editable | DISABLED | **NOT RUN** | disabled |
| /search | page | Retry | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /search | page | Enter guest name, phone number or email... | WIRED (handler) | **NOT RUN** | editable input |
| /search | page | Search | WIRED (handler) | **FAKE** | toast only: Guest search refreshed. |
| /search | page | Clear search | WIRED (handler) | **PASS** | network: GET /api/tenants 200; GET /api/data-requests?page=1&limit=20 200 |
| /search | page | AK Returning Adebola Kamal adebola.kamal@email.com +234 803 456 7890 5 visits La | WIRED (handler) | **PASS** | opens a modal |
| /search | page | SK VIP Sarah Kamal sarah.kamal@email.com +234 812 345 6789 3 visits Last: 08 Nov | WIRED (handler) | **PASS** | opens a modal |
| /search | page | MJ Returning Michael Johnson m.johnson@email.com +234 701 222 9011 8 visits Last | WIRED (handler) | **PASS** | opens a modal |
| /search | page | FB New Fatima Bello fatima.bello@email.com +234 809 765 4321 2 visits Last: 02 N | WIRED (handler) | **PASS** | opens a modal |
| /search | page | DO Returning David Okafor david.okafor@email.com +234 806 111 2233 4 visits Last | WIRED (handler) | **PASS** | opens a modal |
| /search | page | GW VIP Grace Williams grace.w@email.com +234 814 987 6543 6 visits Last: 25 Oct  | WIRED (handler) | **PASS** | opens a modal |
| /workspace/dashboard | page | Search for a guest | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/dashboard | page | Quick Search | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/directory |
| /workspace/dashboard | page | View Jennifer Adeyemi | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View Arjun Okafor | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View Ngozi Garcia | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View Chukwuemeka Mohammed | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/audit-logs; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdqwe16-24"]')[22m
 |
| /workspace/dashboard | page | View Sync Details | WIRED (handler) | **FAKE** | toast only: Opening PMS synchronisation details. |
| /workspace/dashboard | page | View Quick Guide | WIRED (handler) | **FAKE** | toast only: Quick guide opened. |
| /workspace/guest-search | page | Retry | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/guest-search | page | Enter guest name, phone number or email... | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/guest-search | page | Search | WIRED (handler) | **FAKE** | toast only: Guest search refreshed. |
| /workspace/guest-search | page | Clear search | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/guest-search | page | AK Returning Adebola Kamal adebola.kamal@email.com +234 803 456 7890 5 visits La | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-search | page | SK VIP Sarah Kamal sarah.kamal@email.com +234 812 345 6789 3 visits Last: 08 Nov | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-search | page | MJ Returning Michael Johnson m.johnson@email.com +234 701 222 9011 8 visits Last | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-search | page | FB New Fatima Bello fatima.bello@email.com +234 809 765 4321 2 visits Last: 02 N | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-search | page | DO Returning David Okafor david.okafor@email.com +234 806 111 2233 4 visits Last | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-search | page | GW VIP Grace Williams grace.w@email.com +234 814 987 6543 6 visits Last: 25 Oct  | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Add Guest | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Export | WIRED (handler) | **PASS** | network: GET /api/users?page=1&limit=100 200; GET /api/health 200 |
| /workspace/directory | page | Search guest name, email or phone... | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | page | All VIP Returning New | WIRED (handler) | **FAKE** | selection changes but the list does not |
| /workspace/directory | page | Filters | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/directory | page | Select all | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | Select Jennifer Adeyemi | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/directory | page | Select Arjun Okafor | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Arjun Okafor. |
| /workspace/directory | page | Select Ngozi Garcia | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Ngozi Garcia. |
| /workspace/directory | page | Select Chukwuemeka Mohammed | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Chukwuemeka Mohammed. |
| /workspace/directory | page | Select Wei Williams | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Wei Williams. |
| /workspace/directory | page | Select Linda Kumar | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Linda Kumar. |
| /workspace/directory | page | Select Aisha Bello | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Aisha Bello. |
| /workspace/directory | page | Select David Dauda | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing David Dauda. |
| /workspace/directory | page | Select John Al-Hassan | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing John Al-Hassan. |
| /workspace/directory | page | Select Michael Johnson | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Michael Johnson. |
| /workspace/directory | page | Select Chidi Dauda | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Chidi Dauda. |
| /workspace/directory | page | Select Zainab Adeleke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Zainab Adeleke. |
| /workspace/directory | page | Select Obinna Sani | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Obinna Sani. |
| /workspace/directory | page | Select Kunle Patel | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Kunle Patel. |
| /workspace/directory | page | Select Funke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Funke. |
| /workspace/directory | page | Select Emeka Yusuf | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Emeka Yusuf. |
| /workspace/directory | page | Select Adaeze Yamamoto | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | network: GET /api/health 200; GET /api/analytics/activity?days=30 200 |
| /workspace/directory | page | Select James Adeleke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | network: GET /api/tenants 200; GET /api/users?page=1&limit=100 200 |
| /workspace/directory | page | Select Edge ZeroDate | NATIVE (no state wiring) | **NOT RUN** | not found in live DOM |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | network: GET /api/analytics/activity?days=30 200 |
| /workspace/directory | page | Select Seyi Davis | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Seyi Davis. |
| /workspace/directory | page | (icon) | DISABLED | **NOT RUN** | disabled |
| /workspace/directory | page | 1 | DEAD (no handler) | **PASS** | network: GET /api/health 200; GET /api/analytics/activity?days=30 200 |
| /workspace/directory | page | 2 | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/directory | page | 3 | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/directory | page | (icon) | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/guest-profile | page | Edit Profile | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | page | Prepare Registration | WIRED (handler) | **NOT RUN** | extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again. |
| /workspace/guest-profile | page | Overview | WIRED (handler) | **FAKE** | toast only: Overview tab selected. |
| /workspace/guest-profile | page | Visit History | WIRED (handler) | **PASS** | network: GET /api/users?page=1&limit=100 200; GET /api/tenants 200 |
| /workspace/guest-profile | page | Preferences | WIRED (handler) | **PASS** | network: GET /api/tenants 200; GET /api/users?page=1&limit=100 200 |
| /workspace/guest-profile | page | Activity | WIRED (handler) | **PASS** | network: GET /api/users?page=1&limit=100 200; GET /api/tenants 200 |
| /workspace/visit-history | page | Export History | WIRED (handler) | **PASS** | network: GET /api/tenants 200; GET /api/users?page=1&limit=100 200 |
| /workspace/visit-history | page | All time 2026 2025 | NATIVE (no effect) | **NATIVE** | select changed All time -> 2026; no data effect |
| /workspace/visit-history | page | Refresh | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/registration | page | Hotel PMS | WIRED (handler) | **FAKE** | toast only: Hotel PMS home opened. |
| /workspace/registration | page | Enter guest full name | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | guest@email.com | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | +234 000 000 0000 | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/registration | page | Select room type Deluxe Room Executive Suite Standard Room | WIRED (handler) | **PASS** | room select changed  -> Deluxe Room |
| /workspace/registration | page | (icon) | INPUT | **NOT RUN** | editable input |
| /workspace/registration | page | (icon) | INPUT | **NOT RUN** | editable input |
| /workspace/registration | page | (icon) | NATIVE (no state wiring) | **NATIVE** | confirmation checkbox toggles; not connected to submit |
| /workspace/registration | page | Cancel | WIRED (handler) | **PASS** | form fields reset |
| /workspace/registration | page | Complete Registration | WIRED (handler) | **FAKE** | toast only: Guest details prepared. Complete registration in the hotel PMS. |
| /workspace/registration | page | JA Jennifer Adeyemi 440301844093 | WIRED (handler) | **PASS** | prefills Jennifer Adeyemi / jennifer38@yahoo.com; fixed suggestion, no live search |
| /workspace/registration | page | AO Arjun Okafor 911352343236 | WIRED (handler) | **PASS** | prefills Arjun Okafor / arjun_okafor@icloud.com; fixed suggestion, no live search |
| /workspace/registration | page | NG Ngozi Garcia 2343448512366 | WIRED (handler) | **PASS** | prefills Ngozi Garcia / ngozi.garcia@yahoo.com; fixed suggestion, no live search |
| /workspace/pms-sync | page | Sync Now | WIRED (handler) | **PASS** | network: GET /api/users?page=1&limit=100 200; GET /api/tenants 200 |
| /workspace/pms-sync | page | Retry | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/pms-sync | page | Test Connection | WIRED (handler) | **FAKE** | toast only: Connection test successful. |
| /workspace/pms-sync | page | Refresh | WIRED (handler) | **PASS** | network: GET /api/users?page=1&limit=100 200; GET /api/data-requests?page=1&limit=20 200 |
| /workspace/data-requests | page | New Request | WIRED (handler) | **PASS** | opens a modal |
| /workspace/data-requests | page | New Request | WIRED (handler) | **PASS** | opens a modal |
| /workspace/audit-logs | page | Export | WIRED (handler) | **FAKE** | toast only: Audit log export started. |
| /workspace/audit-logs | page | Export Logs | WIRED (handler) | **FAKE** | toast only: Audit logs export started. |
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing receptionist@grandvista.test. |
| /workspace/users | page | (icon) | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/users | page | View permissions | WIRED (handler) | **FAKE** | toast only: Administrator permissions opened. |
| /workspace/users | page | View permissions | WIRED (handler) | **FAKE** | toast only: Regional Manager permissions opened. |
| /workspace/users | page | View permissions | WIRED (handler) | **FAKE** | toast only: Receptionist permissions opened. |
| /workspace/tenants | page | Add Hotel | WIRED (handler) | **PASS** | opens a modal |
| /workspace/tenants | page | Add tenant | WIRED (handler) | **PASS** | opens a modal |
| /workspace/tenants | page | (icon) | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/tenants | page | Manage Hotel Settings | WIRED (handler) | **PASS** | navigation: /workspace/hotel-settings; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdrlpkb-19"]')[22m
 |
| /workspace/settings | page | Save Defaults | WIRED (handler) | **FAKE** | toast only: Settings saved successfully. |
| /workspace/settings | page | (icon) | WIRED (handler) | **FAKE** | toast only: Settings notice dismissed. |
| /workspace/settings | page | General | WIRED (handler) | **PASS** | already active: General |
| /workspace/settings | page | Notifications | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=20 200; GET /api/guests?page=1&limit=1 200 |
| /workspace/settings | page | Security | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | Integrations | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | Account | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/settings | page | (icon) | INPUT | **NOT RUN** | editable input |
| /workspace/settings | page | English (United States) English (United Kingdom) | WIRED (handler) | **PASS** | select changed en-US -> en-GB (state change; Save still required) |
| /workspace/settings | page | Africa/Lagos (WAT) UTC | WIRED (handler) | **PASS** | select changed Africa/Lagos -> UTC (state change; Save still required) |
| /workspace/settings | page | DD/MM/YYYY MM/DD/YYYY | WIRED (handler) | **PASS** | select changed DD/MM/YYYY -> MM/DD/YYYY (state change; Save still required) |
| /workspace/settings | page | Cancel | WIRED (handler) | **DEAD** | request failed: GET /api/sync-status 500 |
| /workspace/settings | page | Save Changes | WIRED (handler) | **PASS** | network: GET /api/users?page=1&limit=100 200; GET /api/health 200 |
| /workspace/hotel-settings | page | Edit Hotel Information | WIRED (handler) | **FAKE** | toast only: Hotel information editor opened. |
| /workspace/hotel-settings | page | (icon) | WIRED (handler) | **PASS** | switch state "gps-switch " -> "gps-switch on" |
| /workspace/hotel-settings | page | (icon) | WIRED (handler) | **PASS** | switch state "gps-switch " -> "gps-switch on" |
| /workspace/hotel-settings | page | 90 days 1 year 3 years 7 years | WIRED (handler) | **PASS** | select changed 365 -> 90 (state change; Save still required) |
| /workspace/hotel-settings | page | English (United States) English (United Kingdom) | WIRED (handler) | **PASS** | select changed en-US -> en-GB (state change; Save still required) |
| /workspace/hotel-settings | page | Africa/Lagos (WAT) UTC | WIRED (handler) | **PASS** | select changed Africa/Lagos -> UTC (state change; Save still required) |
| /workspace/hotel-settings | page | Strict — exact fields only Balanced — phone, email and name Loose — include simi | WIRED (handler) | **PASS** | select changed balanced -> strict (state change; Save still required) |
| /workspace/hotel-settings | page | Every 15 minutes Every 30 minutes Hourly | WIRED (handler) | **PASS** | select changed 15 -> 30 (state change; Save still required) |
| /workspace/hotel-settings | page | Save Settings | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/analytics | page | Last 30 days | NATIVE (no effect) | **NOT RUN** | single option; cannot change |
| /workspace/analytics | page | Guest Directory | WIRED (handler) | **PASS** | navigation: /workspace/directory; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdrq4gz-18"]')[22m
 |
| /workspace/analytics | page | PMS Integration | WIRED (handler) | **PASS** | navigation: /workspace/pms-sync; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdrqdr8-19"]')[22m
 |
| /workspace/analytics | page | User Management | WIRED (handler) | **PASS** | navigation: /workspace/users |
| /workspace/analytics | page | System Settings | WIRED (handler) | **PASS** | navigation: /workspace/settings |
| /workspace/error | page | Copy | WIRED (handler) | **FAKE** | toast only: Error reference copied. |
| /workspace/error | page | Try Again | WIRED (handler) | **FAKE** | toast only: Retrying your request... |
| /workspace/error | page | Go to Guest Search | WIRED (handler) | **PASS** | navigation: /workspace/guest-search; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdrrmjv-19"]')[22m
 |
| /workspace/error | page | Return to Dashboard | WIRED (handler) | **PASS** | navigation: /workspace/dashboard; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdrs1h9-20"]')[22m
 |
| /profile/40f3ebf4-0b08-4e49-8e30-4999d01e7081 | page | Back to search | WIRED (href) | **PASS** | navigation: /search |
| /login | page | you@hotel.com | WIRED (handler) | **NOT RUN** | editable input |
| /login | page | Enter your password | WIRED (handler) | **NOT RUN** | editable input |
| /login | page | Show password | WIRED (handler) | **PASS** | password field type password -> text |
| /login | page | (icon) | WIRED (handler) | **NATIVE** | checkbox toggles visually; no app state |
| /login | page | Forgot password? | WIRED (handler) | **PASS** | opens a modal |
| /login | page | Sign In → | WIRED (form submit) | **PASS** | login request submitted and rejected: 401 |
| /login | page | Secure Sign-In · Your data is safe with us | WIRED (handler) | **PASS** | error/notice shown: Single sign-on is not configured for this workspace. |
| /login | page | Terms of Service | WIRED (href) | **PASS** | opens a modal |
| /login | page | Privacy Policy | WIRED (href) | **PASS** | opens a modal |
| /login | login-help | × | WIRED (handler) | **PASS** | closes the modal |
| /login | login-help | Contact hotel administrator | WIRED (href) | **DEAD** | no state, route, network or download change |
| /workspace/guest-search | guest-view | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/guest-search | guest-view | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/guest-search | guest-view | Open Full Profile | WIRED (handler) | **PASS** | closes the modal; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdrtttv-2"]')[22m
[ |
| /workspace/directory | add-guest | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/directory | directory-view | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | directory-view | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | directory-view | Open Full Profile | WIRED (handler) | **PASS** | closes the modal; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdrw8zn-2"]')[22m
[ |
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
| /workspace/tenants | add-hotel | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/tenants | add-hotel | e.g. Lakeside Suites | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/tenants | add-hotel | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/tenants | add-hotel | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/dashboard | account-menu | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Account settings | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Sign out | WIRED (handler) | **FAKE** | navigates to /login but session cookie survives |
| /login | page | (icon) | WIRED (handler) | **NOT RUN** | editable input |

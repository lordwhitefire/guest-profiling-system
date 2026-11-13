# Supposed-to-be-clickable map

Base: http://localhost:3100 (production build)
Captured: 2026-11-13T10:36:42.316Z

## Counts

```
{
  "WIRED": 186,
  "STATIC": 4,
  "INPUT": 3,
  "DISABLED": 4,
  "NATIVE": 22
}
```

## Shared shell

| Control | Tag / role | Handlers | Expected | Status | Routes |
|---|---|---|---|---|---|
| Guest Profiling System | a/link | onClick | navigate to /workspace/dashboard | **WIRED (href)** | 16 |
| Overview | a/link | onClick | navigate to /workspace/dashboard | **WIRED (href)** | 16 |
| Guest Search | a/link | onClick | navigate to /workspace/guest-search | **WIRED (href)** | 16 |
| Guest Directory | a/link | onClick | navigate to /workspace/directory | **WIRED (href)** | 16 |
| Guest History | a/link | onClick | navigate to /workspace/visit-history | **WIRED (href)** | 16 |
| Registration | a/link | onClick | navigate to /workspace/registration | **WIRED (href)** | 16 |
| Administration | a/link | onClick | navigate to /workspace/analytics | **WIRED (href)** | 16 |
| PMS Integration | a/link | onClick | navigate to /workspace/pms-sync | **WIRED (href)** | 16 |
| Tenants | a/link | onClick | navigate to /workspace/tenants | **WIRED (href)** | 16 |
| Users & Roles | a/link | onClick | navigate to /workspace/users | **WIRED (href)** | 16 |
| Data Requests | a/link | onClick | navigate to /workspace/data-requests | **WIRED (href)** | 16 |
| Audit Logs | a/link | onClick | navigate to /workspace/audit-logs | **WIRED (href)** | 16 |
| Settings | a/link | onClick | navigate to /workspace/settings | **WIRED (href)** | 16 |
| Grand Vista Hotel Hotel workspace | div/button | onClick, onKeyDown | open a menu | **WIRED (handler)** | 11 |
| AD Admin Administrator | div/button | onClick, onKeyDown | open a menu | **WIRED (handler)** | 10 |
| Search guests, properties, users... | input/textbox | onChange, onKeyDown | enter/edit a value | **WIRED (handler)** | 16 |
| Download Report | button/button | onClick | produce a file | **WIRED (handler)** | 16 |
| Notifications | button/button | onClick | open notifications | **WIRED (handler)** | 16 |
| AD | button/button | onClick | open a menu | **WIRED (handler)** | 10 |
| Close | button/button | onClick | close or reset | **WIRED (handler)** | 1 |
| AC Account Team member | div/button | onClick, onKeyDown | open a menu | **WIRED (handler)** | 6 |
| AC | button/button | onClick | open a menu | **WIRED (handler)** | 6 |
| Current hotel Hotel workspace | div/button | onClick, onKeyDown | open a menu | **WIRED (handler)** | 5 |

## Per-page controls


### /design-system

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Primary | button/button | — | perform the labelled action | **STATIC (demo)** |
| Secondary | button/button | — | perform the labelled action | **STATIC (demo)** |
| Ghost | button/button | — | perform the labelled action | **STATIC (demo)** |
| Destructive | button/button | — | perform the labelled action | **STATIC (demo)** |
| you@example.com | input/textbox | — | enter/edit a value | **INPUT** |
| +234 800 000 0000 | input/textbox | — | enter/edit a value | **INPUT** |
| Not editable | input/textbox | — | enter/edit a value | **DISABLED** |

### /search

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Enter guest name, phone number or email... | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Search | button/button | onClick | run the handler | **WIRED (handler)** |
| Clear search | button/button | onClick | run the handler | **WIRED (handler)** |
| Clear search | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/dashboard

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Search for a guest | button/button | onClick | run the handler | **WIRED (handler)** |
| Quick Search | button/button | onClick | run the handler | **WIRED (handler)** |
| View all | button/button | onClick | run the handler | **WIRED (handler)** |
| View Loop Tester Two | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View Funke | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View Omar Al-Hassan | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View Khan | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View all | button/button | onClick | run the handler | **WIRED (handler)** |
| View Sync Details | button/button | onClick | run the handler | **WIRED (handler)** |
| View Quick Guide | button/button | onClick | run the handler | **WIRED (handler)** |
| Close | button/button | onClick | close or reset | **WIRED (handler)** |
| Account settings | button/button | onClick | run the handler | **WIRED (handler)** |
| Sign out | button/button | onClick | end the session | **WIRED (handler)** |

### /workspace/guest-search

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Enter guest name, phone number or email... | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Search | button/button | onClick | run the handler | **WIRED (handler)** |
| Clear search | button/button | onClick | run the handler | **WIRED (handler)** |
| Clear search | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/directory

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Add Guest | button/button | onClick | open a form | **WIRED (handler)** |
| Export | button/button | onClick | produce a file | **WIRED (handler)** (toast?) |
| Search guest name, email or phone... | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| All VIP Returning New | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Filters | button/button | onClick | run the handler | **WIRED (handler)** |
| Select all | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| Select Loop Tester Two | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Loop Tester Two | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Loop Tester Two | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Funke | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Funke | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Funke | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Omar Al-Hassan | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Omar Al-Hassan | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Omar Al-Hassan | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Khan | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Khan | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Khan | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Ibrahim Davis | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Ibrahim Davis | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Ibrahim Davis | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Yuki Mohammed | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Yuki Mohammed | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Yuki Mohammed | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Jennifer Adeyemi | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Jennifer Adeyemi | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Jennifer Adeyemi | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Arjun Okafor | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Arjun Okafor | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Arjun Okafor | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Ngozi Garcia | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Ngozi Garcia | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Ngozi Garcia | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Chukwuemeka Mohammed | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Chukwuemeka Mohammed | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Chukwuemeka Mohammed | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Wei Williams | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Wei Williams | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Wei Williams | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Linda Kumar | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Linda Kumar | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Linda Kumar | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Aisha Bello | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Aisha Bello | button/button | onClick | open notifications | **WIRED (handler)** |
| Edit Aisha Bello | button/button | onClick | open an editor | **WIRED (handler)** |
| Select David Dauda | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View David Dauda | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit David Dauda | button/button | onClick | open an editor | **WIRED (handler)** |
| Select John Al-Hassan | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View John Al-Hassan | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit John Al-Hassan | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Michael Johnson | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Michael Johnson | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Michael Johnson | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Chidi Dauda | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Chidi Dauda | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Chidi Dauda | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Zainab Adeleke | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Zainab Adeleke | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Zainab Adeleke | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Obinna Sani | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Obinna Sani | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Obinna Sani | button/button | onClick | open an editor | **WIRED (handler)** |
| Select Kunle Patel | input/checkbox | — | enter/edit a value | **NATIVE (no state wiring)** |
| View Kunle Patel | button/button | onClick | run the handler | **WIRED (handler)** |
| Edit Kunle Patel | button/button | onClick | open an editor | **WIRED (handler)** |
| Previous page | button/button | onClick | open a menu | **DISABLED** |
| 1 | button/button | — | perform the labelled action | **DISABLED** |
| 2 | button/button | onClick | run the handler | **WIRED (handler)** |
| 3 | button/button | onClick | run the handler | **WIRED (handler)** |
| Next page | button/button | onClick | open a menu | **WIRED (handler)** |
| Close | button/button | onClick | close or reset | **WIRED (handler)** |
| (icon) | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| (icon) | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| (icon) | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| (icon) | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Save | button/button | — | persist the change | **WIRED (form submit)** |

### /workspace/guest-profile

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Edit Profile | button/button | onClick | open an editor | **WIRED (handler)** |
| Prepare Registration | button/button | onClick | run the handler | **WIRED (handler)** |
| Overview | button/button | onClick | run the handler | **WIRED (handler)** |
| Visit History | button/button | onClick | run the handler | **WIRED (handler)** |
| Preferences | button/button | onClick | run the handler | **WIRED (handler)** |
| Activity | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/visit-history

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Export History | button/button | onClick | produce a file | **WIRED (handler)** (toast?) |
| All time 2026 | select/combobox | onChange | change the selected option | **WIRED (handler)** |

### /workspace/registration

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Hotel PMS | button/button | onClick | run the handler | **WIRED (handler)** |
| Start typing to find a returning guest | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| guest@email.com | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| +234 000 000 0000 | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Select room type Deluxe Room Executive Suite Standard Room | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| (icon) | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| (icon) | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| (icon) | input/checkbox | onChange | enter/edit a value | **WIRED (handler)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Complete Registration | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/pms-sync

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Sync Now | button/button | onClick | run the operation | **WIRED (handler)** (toast?) |
| Test Connection | button/button | onClick | run the operation | **WIRED (handler)** (toast?) |
| Refreshing… | button/button | onClick | run the operation | **DISABLED** |

### /workspace/data-requests

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| New Request | button/button | onClick | open a form | **WIRED (handler)** |
| New Request | button/button | onClick | open a form | **WIRED (handler)** |

### /workspace/audit-logs

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Export | button/button | onClick | produce a file | **WIRED (handler)** (toast?) |
| Export Logs | button/button | onClick | produce a file | **WIRED (handler)** (toast?) |

### /workspace/users

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Invite User | button/button | onClick | open a form | **WIRED (handler)** |
| Invite User | button/button | onClick | open a form | **WIRED (handler)** |
| Edit receptionist@grandvista.test | button/button | onClick | open an editor | **WIRED (handler)** |
| Edit admin@grandvista.test | button/button | onClick | open an editor | **WIRED (handler)** |
| View permissions | button/button | onClick | run the handler | **WIRED (handler)** |
| View permissions | button/button | onClick | run the handler | **WIRED (handler)** |
| View permissions | button/button | onClick | run the handler | **WIRED (handler)** |
| Close | button/button | onClick | close or reset | **WIRED (handler)** |
| name@hotel.com | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| At least 8 characters | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Receptionist Hotel Manager Administrator | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Save | button/button | — | persist the change | **WIRED (form submit)** |

### /workspace/tenants

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Add Hotel | button/button | onClick | open a form | **WIRED (handler)** |
| Add tenant | button/button | onClick | open a form | **WIRED (handler)** |
| Switch to Grand Vista Hotel | button/button | onClick | open a menu | **WIRED (handler)** |
| Manage Hotel Settings | button/button | onClick | run the handler | **WIRED (handler)** |
| Close | button/button | onClick | close or reset | **WIRED (handler)** |
| e.g. Lakeside Suites | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Save | button/button | — | persist the change | **WIRED (form submit)** |

### /workspace/settings

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Save Defaults | button/button | onClick | persist the change | **WIRED (handler)** |
| Dismiss notice | button/button | onClick | run the handler | **WIRED (handler)** |
| General | button/button | onClick | run the handler | **WIRED (handler)** |
| Notifications | button/button | onClick | open notifications | **WIRED (handler)** |
| Security | button/button | onClick | run the handler | **WIRED (handler)** |
| Integrations | button/button | onClick | run the handler | **WIRED (handler)** |
| Account | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | input/textbox | — | enter/edit a value | **INPUT** |
| English (United States) English (United Kingdom) | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Africa/Lagos (WAT) UTC | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| DD/MM/YYYY MM/DD/YYYY | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Save Changes | button/button | onClick | persist the change | **WIRED (handler)** (toast?) |

### /workspace/hotel-settings

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Edit Hotel Information | button/button | onClick | open an editor | **WIRED (handler)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| 90 days 1 year 3 years 7 years | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| English (United States) English (United Kingdom) | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Africa/Lagos (WAT) UTC | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Strict — exact fields only Balanced — phone, email and name Loose — include simi | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Every 15 minutes Every 30 minutes Hourly | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Save Settings | button/button | onClick | persist the change | **WIRED (handler)** |

### /workspace/analytics

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Last 30 days | select/combobox | — | change the selected option | **NATIVE (no effect)** |
| Guest Directory | button/button | onClick | run the handler | **WIRED (handler)** |
| PMS Integration | button/button | onClick | run the handler | **WIRED (handler)** |
| User Management | button/button | onClick | run the handler | **WIRED (handler)** |
| System Settings | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/error

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Copy | button/button | onClick | run the handler | **WIRED (handler)** |
| Try Again | button/button | onClick | run the handler | **WIRED (handler)** |
| Go to Guest Search | button/button | onClick | run the handler | **WIRED (handler)** |
| Return to Dashboard | button/button | onClick | run the handler | **WIRED (handler)** |

### /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| ← Back to search | a/link | onClick | navigate to /search | **WIRED (href)** |
| task009.loop@example.com | a/link | — | navigate to mailto:task009.loop@example.com | **WIRED (href)** |
| 2347003334444 | a/link | — | navigate to tel:2347003334444 | **WIRED (href)** |
| Fill registration form | button/button | onClick | run the handler | **WIRED (handler)** |

### /login

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| you@hotel.com | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Enter your password | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Show password | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | input/checkbox | onChange | enter/edit a value | **WIRED (handler)** |
| Forgot password? | button/button | onClick | run the handler | **WIRED (handler)** |
| Sign In → | button/button | — | perform the labelled action | **WIRED (form submit)** |
| Secure Sign-In · Your data is safe with us | button/button | onClick | run the handler | **WIRED (handler)** |
| Terms of Service | a/link | onClick | navigate to # | **WIRED (href)** |
| Privacy Policy | a/link | onClick | navigate to # | **WIRED (href)** |

## Route summary

| Route | Final URL | Controls | Contract rows |
|---|---|---:|---:|
| /design-system | /design-system | 7 | 0 |
| /search | /workspace/guest-search | 23 | 2 |
| /workspace/dashboard | /workspace/dashboard | 29 | 2 |
| /workspace/guest-search | /workspace/guest-search | 23 | 2 |
| /workspace/directory | /workspace/directory | 90 | 2 |
| /workspace/guest-profile | /workspace/guest-profile | 25 | 2 |
| /workspace/visit-history | /workspace/visit-history | 21 | 2 |
| /workspace/registration | /workspace/registration | 10 | 0 |
| /workspace/pms-sync | /workspace/pms-sync | 22 | 2 |
| /workspace/data-requests | /workspace/data-requests | 21 | 2 |
| /workspace/audit-logs | /workspace/audit-logs | 21 | 2 |
| /workspace/users | /workspace/users | 26 | 2 |
| /workspace/tenants | /workspace/tenants | 23 | 2 |
| /workspace/settings | /workspace/settings | 32 | 2 |
| /workspace/hotel-settings | /workspace/hotel-settings | 28 | 2 |
| /workspace/analytics | /workspace/analytics | 24 | 2 |
| /workspace/processing | /workspace/processing | 19 | 2 |
| /workspace/error | /workspace/error | 23 | 2 |
| /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | /profile/1e0c63b9-dde5-4beb-a126-d21bc7b26023 | 4 | 0 |
| /login | /login | 9 | 0 |

## Rows not wired to a real effect

- /workspace/directory — Select all — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Loop Tester Two — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Funke — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Omar Al-Hassan — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Khan — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Ibrahim Davis — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Yuki Mohammed — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Jennifer Adeyemi — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Arjun Okafor — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Ngozi Garcia — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Chukwuemeka Mohammed — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Wei Williams — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Linda Kumar — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Aisha Bello — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select David Dauda — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select John Al-Hassan — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Michael Johnson — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Chidi Dauda — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Zainab Adeleke — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Obinna Sani — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Kunle Patel — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/analytics — Last 30 days — NATIVE (no effect) — expected: change the selected option

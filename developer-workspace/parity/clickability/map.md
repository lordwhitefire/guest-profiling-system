# Supposed-to-be-clickable map

Base: http://localhost:3100 (production build)
Captured: 2026-11-12T09:27:22.936Z

## Counts

```
{
  "WIRED": 198,
  "DEAD": 3,
  "STATIC": 4,
  "INPUT": 5,
  "DISABLED": 2,
  "NATIVE": 24
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
| Search guests, properties, users... | input/textbox | onChange, onKeyDown | enter/edit a value | **WIRED (handler)** | 16 |
| Download Report | button/button | onClick | produce a file | **WIRED (handler)** | 16 |
| Notifications | button/button | onClick | open notifications | **WIRED (handler)** | 16 |
| AO | button/button | onClick | open a menu | **WIRED (handler)** | 16 |
| Grand Vista Hotel + chevron | div | — | open the hotel switcher | **DEAD (contract)** | 16 |
| Admin Operator + three dots | div | — | open the user menu | **DEAD (contract)** | 16 |
| Close | button/button | onClick | close or reset | **WIRED (handler)** | 1 |

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
| Retry | button/button | onClick | run the operation | **WIRED (handler)** |
| Enter guest name, phone number or email... | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Search | button/button | onClick | run the handler | **WIRED (handler)** |
| Clear search | button/button | onClick | run the handler | **WIRED (handler)** |
| AK Returning Adebola Kamal adebola.kamal@email.com +234 803 456 7890 5 visits La | button/button | onClick | run the handler | **WIRED (handler)** |
| SK VIP Sarah Kamal sarah.kamal@email.com +234 812 345 6789 3 visits Last: 08 Nov | button/button | onClick | run the handler | **WIRED (handler)** |
| MJ Returning Michael Johnson m.johnson@email.com +234 701 222 9011 8 visits Last | button/button | onClick | run the handler | **WIRED (handler)** |
| FB New Fatima Bello fatima.bello@email.com +234 809 765 4321 2 visits Last: 02 N | button/button | onClick | open a form | **WIRED (handler)** |
| DO Returning David Okafor david.okafor@email.com +234 806 111 2233 4 visits Last | button/button | onClick | run the handler | **WIRED (handler)** |
| GW VIP Grace Williams grace.w@email.com +234 814 987 6543 6 visits Last: 25 Oct  | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/dashboard

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Search for a guest | button/button | onClick | run the handler | **WIRED (handler)** |
| Quick Search | button/button | onClick | run the handler | **WIRED (handler)** |
| View all | button/button | onClick | run the handler | **WIRED (handler)** |
| View Jennifer Adeyemi | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View Arjun Okafor | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View Ngozi Garcia | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View Chukwuemeka Mohammed | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View all | button/button | onClick | run the handler | **WIRED (handler)** |
| View Sync Details | button/button | onClick | run the handler | **WIRED (handler)** |
| View Quick Guide | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| Close | button/button | onClick | close or reset | **WIRED (handler)** |
| Account settings | button/button | onClick | run the handler | **WIRED (handler)** |
| Sign out | button/button | onClick | end the session | **WIRED (handler)** |

### /workspace/guest-search

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Retry | button/button | onClick | run the operation | **WIRED (handler)** |
| Enter guest name, phone number or email... | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Search | button/button | onClick | run the handler | **WIRED (handler)** |
| Clear search | button/button | onClick | run the handler | **WIRED (handler)** |
| AK Returning Adebola Kamal adebola.kamal@email.com +234 803 456 7890 5 visits La | button/button | onClick | run the handler | **WIRED (handler)** |
| SK VIP Sarah Kamal sarah.kamal@email.com +234 812 345 6789 3 visits Last: 08 Nov | button/button | onClick | run the handler | **WIRED (handler)** |
| MJ Returning Michael Johnson m.johnson@email.com +234 701 222 9011 8 visits Last | button/button | onClick | run the handler | **WIRED (handler)** |
| FB New Fatima Bello fatima.bello@email.com +234 809 765 4321 2 visits Last: 02 N | button/button | onClick | open a form | **WIRED (handler)** |
| DO Returning David Okafor david.okafor@email.com +234 806 111 2233 4 visits Last | button/button | onClick | run the handler | **WIRED (handler)** |
| GW VIP Grace Williams grace.w@email.com +234 814 987 6543 6 visits Last: 25 Oct  | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/directory

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Add Guest | button/button | onClick | open a form | **WIRED (handler)** |
| Export | button/button | onClick | produce a file | **WIRED (handler)** (toast?) |
| Search guest name, email or phone... | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| All VIP Returning New | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| Filters | button/button | onClick | run the handler | **WIRED (handler)** |
| Select all | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| Select Jennifer Adeyemi | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Arjun Okafor | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Ngozi Garcia | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Chukwuemeka Mohammed | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Wei Williams | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Linda Kumar | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Aisha Bello | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select David Dauda | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select John Al-Hassan | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Michael Johnson | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Chidi Dauda | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Zainab Adeleke | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Obinna Sani | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Kunle Patel | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Funke | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Emeka Yusuf | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Adaeze Yamamoto | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select James Adeleke | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Edge ZeroDate | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| Select Seyi Davis | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **DISABLED** |
| 1 | button/button | — | perform the labelled action | **DEAD (no handler)** |
| 2 | button/button | onClick | run the handler | **WIRED (handler)** |
| 3 | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** |
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
| All time 2026 2025 | select/combobox | — | change the selected option | **NATIVE (no effect)** |
| Refresh | button/button | onClick | run the operation | **WIRED (handler)** |

### /workspace/registration

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Hotel PMS | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| Enter guest full name | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| guest@email.com | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| +234 000 000 0000 | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Select room type Deluxe Room Executive Suite Standard Room | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| (icon) | input/textbox | — | enter/edit a value | **INPUT** |
| (icon) | input/textbox | — | enter/edit a value | **INPUT** |
| (icon) | input/checkbox | — | toggle selection | **NATIVE (no state wiring)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Complete Registration | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| JA Jennifer Adeyemi 440301844093 | button/button | onClick | run the handler | **WIRED (handler)** |
| AO Arjun Okafor 911352343236 | button/button | onClick | run the handler | **WIRED (handler)** |
| NG Ngozi Garcia 2343448512366 | button/button | onClick | run the handler | **WIRED (handler)** |

### /workspace/pms-sync

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Sync Now | button/button | onClick | run the operation | **WIRED (handler)** (toast?) |
| Retry | button/button | onClick | run the operation | **WIRED (handler)** |
| Test Connection | button/button | onClick | run the operation | **WIRED (handler)** (toast?) |
| Refresh | button/button | onClick | run the operation | **WIRED (handler)** |

### /workspace/data-requests

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| New Request | button/button | onClick | open a form | **WIRED (handler)** |
| New Request | button/button | onClick | open a form | **WIRED (handler)** |
| Close | button/button | onClick | close or reset | **WIRED (handler)** |
| guest@example.com | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Data Access Data Export Correction Deletion | select/combobox | onChange | change the selected option | **WIRED (handler)** |
| What should be done? | textarea/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Save | button/button | — | persist the change | **WIRED (form submit)** |

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
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
| View permissions | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View permissions | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
| View permissions | button/button | onClick | run the handler | **WIRED (handler)** (toast?) |
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
| (icon) | button/button | onClick | open a menu | **WIRED (handler)** (toast?) |
| Manage Hotel Settings | button/button | onClick | run the handler | **WIRED (handler)** |
| Close | button/button | onClick | close or reset | **WIRED (handler)** |
| e.g. Lakeside Suites | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Cancel | button/button | onClick | close or reset | **WIRED (handler)** |
| Save | button/button | — | persist the change | **WIRED (form submit)** |

### /workspace/settings

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Save Defaults | button/button | onClick | persist the change | **WIRED (handler)** (toast?) |
| (icon) | button/button | onClick | run the handler | **WIRED (handler)** |
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
| Edit Hotel Information | button/button | onClick | open an editor | **WIRED (handler)** (toast?) |
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

### /profile/40f3ebf4-0b08-4e49-8e30-4999d01e7081

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| Back to search | a/link | onClick | navigate to /search | **WIRED (href)** |

### /login

| Control | Tag / role | Handlers | Expected | Status |
|---|---|---|---|---|
| you@hotel.com | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Enter your password | input/textbox | onChange | enter/edit a value | **WIRED (handler)** |
| Show password | button/button | onClick | run the handler | **WIRED (handler)** |
| (icon) | input/checkbox | onChange | toggle selection | **WIRED (handler)** |
| Forgot password? | button/button | onClick | run the handler | **WIRED (handler)** |
| Sign In → | button/button | — | perform the labelled action | **WIRED (form submit)** |
| Secure Sign-In · Your data is safe with us | button/button | onClick | run the handler | **WIRED (handler)** |
| Terms of Service | a/link | onClick | navigate to # | **WIRED (href)** |
| Privacy Policy | a/link | onClick | navigate to # | **WIRED (href)** |

## Route summary

| Route | Final URL | Controls | Contract rows |
|---|---|---:|---:|
| /design-system | /design-system | 7 | 0 |
| /search | /workspace/guest-search | 27 | 2 |
| /workspace/dashboard | /workspace/dashboard | 27 | 2 |
| /workspace/guest-search | /workspace/guest-search | 27 | 2 |
| /workspace/directory | /workspace/directory | 88 | 2 |
| /workspace/guest-profile | /workspace/guest-profile | 23 | 2 |
| /workspace/visit-history | /workspace/visit-history | 20 | 2 |
| /workspace/registration | /workspace/registration | 13 | 0 |
| /workspace/pms-sync | /workspace/pms-sync | 21 | 2 |
| /workspace/data-requests | /workspace/data-requests | 19 | 2 |
| /workspace/audit-logs | /workspace/audit-logs | 19 | 2 |
| /workspace/users | /workspace/users | 24 | 2 |
| /workspace/tenants | /workspace/tenants | 21 | 2 |
| /workspace/settings | /workspace/settings | 30 | 2 |
| /workspace/hotel-settings | /workspace/hotel-settings | 26 | 2 |
| /workspace/analytics | /workspace/analytics | 22 | 2 |
| /workspace/processing | /workspace/processing | 17 | 2 |
| /workspace/error | /workspace/error | 21 | 2 |
| /profile/40f3ebf4-0b08-4e49-8e30-4999d01e7081 | /profile/40f3ebf4-0b08-4e49-8e30-4999d01e7081 | 1 | 0 |
| /login | /login | 9 | 0 |

## Rows not wired to a real effect

- /search — Grand Vista Hotel + chevron — DEAD (contract) — expected: open the hotel switcher
- /search — Admin Operator + three dots — DEAD (contract) — expected: open the user menu
- /workspace/directory — Select all — NATIVE (no state wiring) — expected: enter/edit a value
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
- /workspace/directory — Select Funke — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Emeka Yusuf — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Adaeze Yamamoto — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select James Adeleke — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Edge ZeroDate — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — Select Seyi Davis — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/directory — 1 — DEAD (no handler) — expected: perform the labelled action
- /workspace/visit-history — All time 2026 2025 — NATIVE (no effect) — expected: change the selected option
- /workspace/registration — (icon) — NATIVE (no state wiring) — expected: enter/edit a value
- /workspace/analytics — Last 30 days — NATIVE (no effect) — expected: change the selected option

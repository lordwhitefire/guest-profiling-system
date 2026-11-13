# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-12T16:49:40.195Z

## Counts

```
{
  "PASS": 7,
  "NOT RUN": 2,
  "FAKE": 4
}
```

## FAKE (toast only)

- /workspace/dashboard — View Arjun Okafor — toast only: Arjun Okafor's profile opened.
- /workspace/dashboard — View Ngozi Garcia — toast only: Ngozi Garcia's profile opened.
- /workspace/dashboard — View Sync Details — toast only: Opening PMS synchronisation details.
- /workspace/dashboard — Sign out — navigates to /login but session cookie survives

## DEAD


## NOT RUN

- /workspace/dashboard — View Jennifer Adeyemi — not found in live DOM
- /workspace/dashboard — View Chukwuemeka Mohammed — not found in live DOM

## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
| /workspace/dashboard | page | Search for a guest | WIRED (handler) | **PASS** | navigation: /workspace/guest-search |
| /workspace/dashboard | page | Quick Search | WIRED (handler) | **PASS** | navigation: /workspace/guest-search; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwds6vfv-18"]')[22m
 |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/directory; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwds75ck-19"]')[22m
 |
| /workspace/dashboard | page | View Jennifer Adeyemi | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View Arjun Okafor | WIRED (handler) | **FAKE** | toast only: Arjun Okafor's profile opened. |
| /workspace/dashboard | page | View Ngozi Garcia | WIRED (handler) | **FAKE** | toast only: Ngozi Garcia's profile opened. |
| /workspace/dashboard | page | View Chukwuemeka Mohammed | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/dashboard | page | View all | WIRED (handler) | **PASS** | navigation: /workspace/audit-logs; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwds827i-24"]')[22m
 |
| /workspace/dashboard | page | View Sync Details | WIRED (handler) | **FAKE** | toast only: Opening PMS synchronisation details. |
| /workspace/dashboard | page | View Quick Guide | WIRED (handler) | **PASS** | network: GET /api/data-requests?page=1&limit=20 200; GET /api/users?page=1&limit=100 200 |
| /workspace/dashboard | account-menu | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Account settings | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Sign out | WIRED (handler) | **FAKE** | navigates to /login but session cookie survives |

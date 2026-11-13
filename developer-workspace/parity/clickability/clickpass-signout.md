# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-13T11:55:45.846Z

## Counts

```
{
  "PASS": 12,
  "FAKE": 1
}
```

## FAKE (toast only)

- /workspace/dashboard — Sign out — /api/auth/me 401; dashboard still signed in

## DEAD


## NOT RUN


## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
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
| /workspace/dashboard | account-menu | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Account settings | WIRED (handler) | **PASS** | closes the modal |
| /workspace/dashboard | account-menu | Sign out | WIRED (handler) | **FAKE** | /api/auth/me 401; dashboard still signed in |

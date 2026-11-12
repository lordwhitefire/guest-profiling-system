# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-12T17:08:55.473Z

## Counts

```
{
  "PASS": 2,
  "NOT RUN": 1,
  "DEAD": 1
}
```

## FAKE (toast only)


## DEAD

- /workspace/pms-sync — Refresh — no state, route, network or download change

## NOT RUN

- /workspace/pms-sync — Retry — not found in live DOM

## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
| /workspace/pms-sync | page | Sync Now | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=20 200; GET /api/users?page=1&limit=100 200 |
| /workspace/pms-sync | page | Retry | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/pms-sync | page | Test Connection | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=20 200; GET /api/data-requests?page=1&limit=20 200 |
| /workspace/pms-sync | page | Refresh | WIRED (handler) | **DEAD** | no state, route, network or download change |

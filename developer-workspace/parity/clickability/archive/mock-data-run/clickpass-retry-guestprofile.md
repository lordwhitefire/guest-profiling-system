# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-12T17:15:09.458Z

## Counts

```
{
  "PASS": 5,
  "NOT RUN": 6,
  "FAKE": 2
}
```

## FAKE (toast only)

- /workspace/guest-profile — Visit History — toast only: Visit History tab selected.
- /workspace/guest-profile — Activity — toast only: Activity tab selected.

## DEAD


## NOT RUN

- /workspace/guest-profile — Prepare Registration — extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again.
- /workspace/guest-profile — (icon) — editable input
- /workspace/guest-profile — (icon) — editable input
- /workspace/guest-profile — (icon) — editable input
- /workspace/guest-profile — (icon) — editable input
- /workspace/guest-profile — Save — submitting creates a record; tested in phase 4 with disposable data

## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
| /workspace/guest-profile | page | Edit Profile | WIRED (handler) | **PASS** | opens a modal |
| /workspace/guest-profile | page | Prepare Registration | WIRED (handler) | **NOT RUN** | extension bridge not loaded: Extension not detected. Install and enable the Guest Profiling extension, then try again. |
| /workspace/guest-profile | page | Overview | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=1 200; GET /api/users?page=1&limit=100 200 |
| /workspace/guest-profile | page | Visit History | WIRED (handler) | **FAKE** | toast only: Visit History tab selected. |
| /workspace/guest-profile | page | Preferences | WIRED (handler) | **PASS** | network: GET /api/guests?page=1&limit=1 200 |
| /workspace/guest-profile | page | Activity | WIRED (handler) | **FAKE** | toast only: Activity tab selected. |
| /workspace/guest-profile | guest-edit | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/guest-profile | guest-edit | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/guest-profile | guest-edit | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/guest-profile | guest-edit | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/guest-profile | guest-edit | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/guest-profile | guest-edit | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/guest-profile | guest-edit | Save | WIRED (handler) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |

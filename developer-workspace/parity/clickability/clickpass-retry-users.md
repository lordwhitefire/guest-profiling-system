# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-12T17:10:58.533Z

## Counts

```
{
  "PASS": 5,
  "NOT RUN": 4,
  "FAKE": 4
}
```

## FAKE (toast only)

- /workspace/users — (icon) — toast only: Editing admin@grandvista.test.
- /workspace/users — View permissions — toast only: Administrator permissions opened.
- /workspace/users — View permissions — toast only: Regional Manager permissions opened.
- /workspace/users — View permissions — toast only: Receptionist permissions opened.

## DEAD


## NOT RUN

- /workspace/users — (icon) — not found in live DOM
- /workspace/users — name@hotel.com — editable input
- /workspace/users — At least 8 characters — editable input
- /workspace/users — Save — submitting creates a record; tested in phase 4 with disposable data

## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | Invite User | WIRED (handler) | **PASS** | opens a modal |
| /workspace/users | page | (icon) | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/users | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing admin@grandvista.test. |
| /workspace/users | page | View permissions | WIRED (handler) | **FAKE** | toast only: Administrator permissions opened. |
| /workspace/users | page | View permissions | WIRED (handler) | **FAKE** | toast only: Regional Manager permissions opened. |
| /workspace/users | page | View permissions | WIRED (handler) | **FAKE** | toast only: Receptionist permissions opened. |
| /workspace/users | invite-user | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/users | invite-user | name@hotel.com | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/users | invite-user | At least 8 characters | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/users | invite-user | Receptionist Hotel Manager Administrator | WIRED (handler) | **PASS** | select changed Receptionist -> RegionalManager (state change) |
| /workspace/users | invite-user | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/users | invite-user | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |

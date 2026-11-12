# TASK-009 — click pass

Base: http://localhost:3100 (production build)
Captured: 2026-11-12T17:07:34.724Z

## Counts

```
{
  "PASS": 29,
  "FAKE": 20,
  "NOT RUN": 12,
  "NATIVE": 19,
  "DEAD": 1
}
```

## FAKE (toast only)

- /workspace/directory — Export — toast only: Guest directory exported.
- /workspace/directory — (icon) — toast only: Editing Jennifer Adeyemi.
- /workspace/directory — (icon) — toast only: Editing Arjun Okafor.
- /workspace/directory — (icon) — toast only: Editing Ngozi Garcia.
- /workspace/directory — (icon) — toast only: Editing Chukwuemeka Mohammed.
- /workspace/directory — (icon) — toast only: Editing Wei Williams.
- /workspace/directory — (icon) — toast only: Editing Linda Kumar.
- /workspace/directory — (icon) — toast only: Editing David Dauda.
- /workspace/directory — (icon) — toast only: Editing John Al-Hassan.
- /workspace/directory — (icon) — toast only: Editing Michael Johnson.
- /workspace/directory — (icon) — toast only: Editing Chidi Dauda.
- /workspace/directory — (icon) — toast only: Editing Zainab Adeleke.
- /workspace/directory — (icon) — toast only: Editing Obinna Sani.
- /workspace/directory — (icon) — toast only: Editing Kunle Patel.
- /workspace/directory — (icon) — toast only: Editing Funke.
- /workspace/directory — (icon) — toast only: Editing Emeka Yusuf.
- /workspace/directory — (icon) — toast only: Editing Adaeze Yamamoto.
- /workspace/directory — (icon) — toast only: Editing James Adeleke.
- /workspace/directory — (icon) — toast only: Editing Edge ZeroDate.
- /workspace/directory — (icon) — toast only: Editing Seyi Davis.

## DEAD

- /workspace/directory — (icon) — no state, route, network or download change

## NOT RUN

- /workspace/directory — Search guest name, email or phone... — editable input
- /workspace/directory — Select Jennifer Adeyemi — not found in live DOM
- /workspace/directory — (icon) — not found in live DOM
- /workspace/directory — Select David Dauda — not found in live DOM
- /workspace/directory — (icon) — disabled
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — editable input
- /workspace/directory — (icon) — could not open add-guest: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for getByRole(
- /workspace/directory — Save — submitting creates a record; tested in phase 4 with disposable data
- /workspace/directory — Close — could not open directory-view: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('.
- /workspace/directory — Close — could not open directory-view: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('.

## All rows

| Route | Scope | Control | Map status | Verdict | Evidence |
|---|---|---|---|---|---|
| /workspace/directory | page | Add Guest | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | Export | WIRED (handler) | **FAKE** | toast only: Guest directory exported. |
| /workspace/directory | page | Search guest name, email or phone... | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | page | All VIP Returning New | WIRED (handler) | **PASS** | row list changed (20 -> 0) |
| /workspace/directory | page | Filters | WIRED (handler) | **PASS** | network: GET /api/data-requests?page=1&limit=20 200; GET /api/analytics/activity?days=30 200 |
| /workspace/directory | page | Select all | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | Select Jennifer Adeyemi | NATIVE (no state wiring) | **NOT RUN** | not found in live DOM |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Jennifer Adeyemi. |
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
| /workspace/directory | page | (icon) | WIRED (handler) | **NOT RUN** | not found in live DOM |
| /workspace/directory | page | Select David Dauda | NATIVE (no state wiring) | **NOT RUN** | not found in live DOM |
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
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Adaeze Yamamoto. |
| /workspace/directory | page | Select James Adeleke | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing James Adeleke. |
| /workspace/directory | page | Select Edge ZeroDate | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Edge ZeroDate. |
| /workspace/directory | page | Select Seyi Davis | NATIVE (no state wiring) | **NATIVE** | checkbox toggles visually; no app state |
| /workspace/directory | page | (icon) | WIRED (handler) | **PASS** | opens a modal |
| /workspace/directory | page | (icon) | WIRED (handler) | **FAKE** | toast only: Editing Seyi Davis. |
| /workspace/directory | page | (icon) | DISABLED | **NOT RUN** | disabled |
| /workspace/directory | page | 1 | DEAD (no handler) | **PASS** | already active: 1 |
| /workspace/directory | page | 2 | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/directory | page | 3 | WIRED (handler) | **PASS** | screen/state changed |
| /workspace/directory | page | (icon) | WIRED (handler) | **DEAD** | no state, route, network or download change |
| /workspace/directory | add-guest | Close | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | editable input |
| /workspace/directory | add-guest | (icon) | WIRED (handler) | **NOT RUN** | could not open add-guest: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for getByRole( |
| /workspace/directory | add-guest | Cancel | WIRED (handler) | **PASS** | closes the modal |
| /workspace/directory | add-guest | Save | WIRED (form submit) | **NOT RUN** | submitting creates a record; tested in phase 4 with disposable data |
| /workspace/directory | directory-view | Close | WIRED (handler) | **NOT RUN** | could not open directory-view: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('. |
| /workspace/directory | directory-view | Close | WIRED (handler) | **NOT RUN** | could not open directory-view: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('. |
| /workspace/directory | directory-view | Open Full Profile | WIRED (handler) | **PASS** | closes the modal; clickErr: locator.click: Timeout 2500ms exceeded.
Call log:
[2m  - waiting for locator('[data-click-id="cp-mwdswc6b-2"]')[22m
[ |

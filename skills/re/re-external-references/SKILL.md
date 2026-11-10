---
name: re-external-references
description: "Reference-and-gate for external reverse-engineering projects — Reversa and REA. Names their official sites and repos, what each is good for, and the approval gate before any install or run. It never installs, clones, or executes them on its own."
---

# External RE references — Reversa and REA

**One question:** is an external RE project actually needed here — and if so, what must be true before
it is installed or run?

## Sources read

- The read-only mechanics survey in the **agentic-frameworks** workspace at
  `developer-workspace/reports/reverse-engineering-mechanics-survey/` — `README.md`,
  `01-rea-summary.md`, `04-reversa-summary.md`, `07-cross-repo-view.md` — read 2026-11-10. Evidence
  level **E2** (coherent by code-read); no repo code was run, installed, cloned, or copied. If that
  workspace is not present, use the official sources and the facts below.
- `developer-workspace/plans/reverse-engineering-mechanics-survey-plan.md` §2a — official sites and
  repos, confirmed 2026-11-08; read 2026-11-10.
- The brief's **“Repos to study — not methods”** section — read 2026-11-10.

**Licence check, 2026-11-10:** Reversa's official `LICENSE` and `package.json` were read — **MIT**.
REA's summary records **MIT**. Confirm the exact version and any commercial engine licences before
use.

**Not read:** REA's analyzer implementations (Ghidra, JADX, ASAR, browser, and the rest) — not read,
so this skill makes no claim about them. Reversa's install/run path was not executed; no install or
run command is given here.

## When to load

- The owner mentions Reversa or REA.
- The target is installed software without source — REA's stated use.
- A source, forward, migration, or parity mechanic might help — Reversa's area.
- Local tools are insufficient and the agent is about to reach for an external RE project.
- Before any install, clone, `npm install`, `npx`, `curl | sh`, Docker pull, MCP server, or CLI run.

## The rule

**Local tools first. Reversa and REA are references, not dependencies.** Being named in this skill is
not permission to install or run them. The ownership gate, the isolation gate, and the hard rules
still apply, in that order.

## The two references

| Project | Official source | What it is | Best for | Limits |
|---|---|---|---|---|
| **Reversa** | <https://sandeco.github.io/reversa/> · <https://github.com/sandeco/reversa> | A prompt-driven reverse-engineering and forward-engineering framework: Agent Skills (Markdown) plus a thin Node.js CLI that installs them and manages state (`.reversa/state.json`). Five-phase Discovery, Forward, Migration, Reconstructor, and Refactor pipelines. | Source-level discovery, forward/migration/parity mechanics, phase checkpoints, specs organization, explicit `[DÚVIDA]` markers, the characterization safety net. | The behaviour lives in Markdown skills; it is **not a binary analyser**. The CLI installs skills and state into a project — it says it leaves pre-existing files untouched, but it still adds files, so use a copy. MIT per the official repo (`LICENSE` and `package.json`, read 2026-11-10); confirm the exact version. |
| **REA (Reverse Engineer Anything)** | <https://rea.tools/> · <https://github.com/morluto/rea> | `rea-agents` v6.8.0, MIT. An MCP server and CLI exposing provider-backed analyzers (native, JavaScript/Electron, managed, Android, Apple, firmware, WASM, packet/signal, API contracts) under one evidence/unknown lifecycle. | Installed software without source; semantic evidence identity, unknown revisions, coverage discipline, first-class limits, atomic staged mutation. | The analyzers were not read in the survey. It needs providers, engines, and a host. It does not journal automatically. **Official repo only** — a fake trojan copy has been reported; do not download or run a mirror. It grants no licence for commercial engines (IDA Pro/Hex-Rays, Hopper, JEB); obtain and authorise those yourself. |
| **CodeConcise, Swimm** | none | Commercial products named in the brief, not repositories. | Not adopted; no run path. | No repo to install or read. This skill gives them no execution path. |

## What each is good for — and not

- **Reversa** is a framework for understanding and rebuilding **source/business software**. It is not
  the tool for a stripped binary or a malware sample. Its useful material for this agent is its
  mechanics: phase state, checkpoints, specs decisions, open-question markers, parity specs, and the
  characterization net.
- **REA** is the closer fit for **installed software without source** and for the evidence discipline
  around an investigation. It is still an external agent surface, not a trusted local command. Its
  output is evidence to verify, not truth.
- **Neither** replaces the ownership gate, the real-lab gate, or this agent's report.

## The gate — before any install or run

1. **Owner approval in `scope.md`.** Which project, which commit or tag, what it may do, and which
   copy or workspace it may touch.
2. **Official repo only.** Verify the URL; no mirrors, no forks, no search-result downloads. Record
   the commit/tag and its hash.
3. **Licence check.** Comply. REA and Reversa are MIT; confirm the exact version, and obtain any
   commercial engine licences (IDA Pro/Hex-Rays, Hopper, JEB) yourself.
4. **Read the install and run path.** Read the official docs and the exact code that will execute. No
   blind `npm install`, unpinned `npx`, `curl | sh`, Docker pull, or MCP server launch.
5. **Isolated copy or real lab.** No host execution of an untrusted sample. No sample upload. No
   network unless approved. No writes outside `re/`. Never modify the original.
6. **The external project does not inherit authority.** Its output is evidence to verify. The
   ownership, isolation, and reporting gates still apply.
7. **Record the run.** Version or commit, command, output location, what was observed, and the
   teardown.

## Decision table

| Situation | What to do |
|---|---|
| You need an idea or a mechanic | Read the survey record or the official repo source. Do not install. |
| The target is a binary or malware | Reversa is not the tool. Use the local static tools; REA only after the gate and in a lab. |
| The target is installed software without source | REA's stated use. Gate first. |
| The target is source or business software | Reversa's mechanics may fit. Gate first. |
| The local tools are enough | Do not use an external project. |
| The target is third-party without permission | Stop. No external tool changes that. |

## What this skill does not do

- It gives no install, clone, or run command.
- It does not authorise an unpinned version, a mirror, vendoring, or copying repo code.
- It does not run `npm install`, `npx`, `curl`, Docker, or an MCP server automatically.
- It does not claim the survey verified the analyzers or that either project is safe to run.
- It does not substitute for a missing local tool or a missing platform skill.

## Failure

If the official repo, licence, commit, or owner approval is missing, stop and name it. If the owner
wants actual use, the next step is to read the official install/run documentation at a pinned commit
and add a verified procedure — never to guess one.

# Guest Profiling System — Builder Context Bundle

This repository contains a portable context bundle for building the **Guest Profiling System**.

## Contents (repacked by repomix)

**Agents:**
- `agents/reverse-engineering-agent.md`
- `agents/product-management-agent.md`
- `agents/openspec-architect.md`

**Skills:**

*Reverse Engineering (`re/`)*
- `re-triage` — ownership, mode, hash, type, provenance, lab status
- `re-static-analysis` — source, binary, APK, JS, firmware; no execution
- `re-dynamic-lab` — stop-gate, lab checklist, one approval per run, teardown
- `re-reporting` — evidence, confidence, limits, plain report
- `re-external-references` — Reversa/REA official sources, gate before install/run

*Product Management (`product-management/`)*
- `product-management-comprehend` — C: Comprehend the situation
- `product-management-identify` — I: Identify customer & stakeholder
- `product-management-report` — R: Report customer's needs
- `product-management-cut` — C: Cut through prioritization
- `product-management-list` — L: List solutions (quick win, core bet, longer horizon)
- `product-management-evaluate` — E: Evaluate trade-offs
- `product-management-summarize` — S: Summarize recommendation

*OpenSpec Architect (`openspec/`)*
- `openspec-explore` — explore/investigate before writing
- `openspec-propose` — create a change with all artifacts
- `openspec-update-change` — revise planning artifacts coherently
- `openspec-sync-specs` — sync delta specs to main specs
- `openspec-archive-change` — finalize and archive completed change

*Blueprint (`blueprint/`)*
- `blueprint` — Victor's build model with 80-area Checklist

*Architect boundaries (`architect/`)*
- (Referenced by openspec-architect; no local skill files)

## Not in repomix (independent in repo)

- `guest-profiling-system-explained.md` — the plain-language plan for the Guest Profiling System

## Usage

```bash
# The repomix file is the single context bundle for the builder agent
repomix-output.xml
```

## Software name

**Guest Profiling System** — core product.
**PMS Adapter** — integration component per hotel.

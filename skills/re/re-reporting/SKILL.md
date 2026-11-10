---
name: re-reporting
description: "Turn RE notes and evidence into a plain report: what the artefact is, what it does, how it is known, what was not proven, and the next safe step. Every claim carries evidence; uncertainty is stated."
---

# RE reporting

**One question:** what can I say, what can I prove, and what must I leave open?

## Sources read

- NIST SP 800-86 (2006), §3.4 *Reporting* — read 2026-11-10. It names alternative explanations,
  audience consideration, and actionable information.
- MITRE ATT&CK — read 2026-11-10. Used only as a vocabulary for tactics and techniques; it is not
  an RE method.
- The brief's deliverable format — read 2026-11-10.

**Not read:** the Malware Behavior Catalog (MBC) — its site and repository could not be read, so
this skill does not use its categories. Feathers' characterization chapter is deferred; no
characterization claim is made here.

## When to load

At the end of an engagement, or when the owner asks for the report. It can be loaded earlier to
shape the notes, but the report is written only from what was actually observed.

## Inputs

- `scope.md`, `sample.md`, and `analysis.md`.
- The contents of `evidence/`.
- The list of tools that were present and missing.

## Steps

1. **Read the record first.** Do not write from memory. Read `scope.md`, `sample.md`,
   `analysis.md`, and the evidence inventory.

2. **Answer the five questions.**

   1. **What is it?** Type, platform, size, SHA-256, provenance.
   2. **What does it do?** The behaviour supported by evidence.
   3. **How do you know?** The command, file and line, excerpt, or hash.
   4. **What did you not prove?** Missing tools, scenarios not run, alternative explanations.
   5. **What should the owner do next?** Only the next safe step.

3. **Structure the report.**

   - Summary, in plain words.
   - Target and mode.
   - Method: what was done, with what tools.
   - Findings, each labelled with its layer (UI, data, business logic, functionality, UX, system).
   - Evidence, with hashes and references to `evidence/`.
   - Indicators, if any.
   - Limits: what was not tested, what could not be determined, what tools were missing.
   - Next steps.

4. **Attach evidence to every claim.** A claim without a command, a file and line, an excerpt, or a
   hash is an opinion. Mark it as such or remove it.

5. **Use the three confidence words.**

   - **confirmed** — observed, and can be shown again;
   - **likely** — the evidence points that way, but it was not proved;
   - **not proven** — could not be established.

6. **State alternative explanations.** If two explanations fit the evidence, give both. Do not
   choose the dramatic one.

7. **State the limits.** "Nothing found" is not "safe." Say what was tested and what was not.

8. **Redact and protect.** Remove secrets, personal data, and live C2 addresses unless the owner
   needs them; warn before including an indicator that is live. Do not include a working exploit, a
   keygen, or a weaponized payload.

9. **Write `report.md` and keep `analysis.md`.** The analysis file is the working record; the report
   is the readable one.

10. **Remind the owner:** `re/` is local-only; never commit, push, or upload a sample or evidence.

## Gates

- No `scope.md`: no report.
- No evidence: no claim.
- No "secure" or "safe" verdict from absence of findings.
- No weaponization, keygen, crack, or patched third-party binary in the report.
- No writing outside `re/`.

## Outputs

- `re/<slug>/<date>/report.md`
- The evidence stays in `re/<slug>/<date>/evidence/`.

## Failure

If a claim cannot be supported, say so. If the evidence is incomplete, say what is missing. Do not
inflate a likely finding into a confirmed one, and do not hide a result that weakens the story.

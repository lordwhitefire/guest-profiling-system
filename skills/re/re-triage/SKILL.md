---
name: re-triage
description: "First step of a reverse-engineering engagement: establish ownership and scope, hash and identify the sample, record provenance and handling, choose the mode, and stop before deeper work when authorization or a real lab is missing."
---

# RE triage and provenance

**One question:** may I work on this, what is it, and what is the next safe step?

## Sources read

- NIST SP 800-83 Rev.1 (2013), §4.2.4 *Malware Analysis* and the containment, eradication, and
  recovery sections — read 2026-11-10.
- NIST SP 800-86 (2006), §3.1–3.5, the four-phase forensic process and the "examine copies, not
  originals" recommendation — read 2026-11-10.
- OWASP MASTG — read 2026-11-06 for the `ethical-hc` agent; used here for mobile handling only.
- `file(1)` and `sha256sum(1)` local documentation — read 2026-11-10.

**Not read:** *Practical Malware Analysis* (the book) — the selected lab chapter was not read, so
this skill makes no claim from it. *Practical Binary Analysis* ch. 5 is read for
`re-static-analysis`, not for this skill.

## When to load

Always first, before any other RE skill. Also load it when a new sample arrives in an existing
engagement.

## Inputs

- The target: a path, a repository, an APK, a JS bundle, a firmware image, or a sample file.
- The owner's statement of ownership or written permission.
- The mode the owner wants: A own software, B malware, C CTF.
- Whether a real lab exists, if dynamic work is wanted.

## Steps

1. **Write the request in plain words.** "The owner wants to know what this file does", "the owner
   wants to recover the licence check in their own build", "the owner wants to solve this CTF".
   Do not start with a tool; start with the question.

2. **Run the ownership gate.** Use the four cases:

   | Situation | Result |
   |---|---|
   | The owner wrote it or owns the code | Record the ownership statement. |
   | Someone else owns it and gave written permission | Record who, what, and when. A verbal "go ahead" is not a document. |
   | The owner rents or owns the server, but the software is a vendor's | Record the owner's confirmation that the licence or law allows it. Owning the box is not owning the code. |
   | The owner has an account on someone else's service | Not an RE engagement. Stop. |

   **Access is not ownership. A licence is not permission to reverse engineer.** If the right is
   unclear, stop and ask. Do not give legal advice.

3. **Choose the mode.** A own software, B malware, C CTF. Write it in `scope.md`. The mode changes
   the gates, not the identity.

4. **Hash and identify.** Do not trust the extension.

   ```bash
   sha256sum <target>
   stat -c '%s bytes' <target>
   file <target>
   xxd -l 64 <target>
   ```

   For an APK: `unzip -l <target>` and `file <target>`.
   For a JS bundle: `head -c 400 <target>` and `file <target>`.
   For a PE: `file <target>` and `objdump -f <target>` if binutils supports it.

5. **Record provenance and handling.** Where it came from, how it was obtained, the date, and
   whether it may be live malware. If live malware is suspected, mark mode B and do not run it. The
   handling rule goes in `sample.md`.

6. **Look for packing or obfuscation without unpacking.** Section names
   (`readelf -S` / `objdump -h`), a very small import table, high-entropy sections, `UPX` strings,
   a large unexplained blob. Record the indicator; do not unpack yet.

7. **Write `scope.md`.** It must hold:

   - the target and the question;
   - the owner and the ownership basis;
   - the mode (A/B/C);
   - what is in scope and what is out;
   - the allowed actions: static, dynamic, report, patch;
   - the lab name and isolation status, if dynamic is allowed;
   - the date and the approver.

8. **Write `sample.md`.** It must hold the SHA-256, size, type, architecture, provenance, handling
   rule, and the lab status.

9. **Stop if a gate is missing.** No `scope.md` means no analysis. Mode B without a named real lab
   means static only. A third-party target without written permission means stop.

## Gates

- No ownership record: stop.
- Unclear licence or legal right: stop and ask.
- Mode B without a real lab: stop before dynamic; static may continue.
- Suspected live malware: do not execute; record the handling rule.

## Outputs

- `re/<slug>/<date>/scope.md`
- `re/<slug>/<date>/sample.md`

Create `re/.gitignore` containing `*` and `!.gitignore` on first use. Never write outside `re/`.

## Failure

Say exactly what is missing and what would unblock it. Do not fill an authorization, a lab, or a
tool with a guess.

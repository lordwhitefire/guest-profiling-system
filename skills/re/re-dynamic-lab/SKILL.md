---
name: re-dynamic-lab
description: "Run a sample only inside a real, named isolated lab and observe its behaviour. This skill is a stop-gate: no named lab, no host execution, no invented isolation. It covers the lab checklist, one approval per run, observation, and teardown."
---

# RE dynamic analysis and the lab gate

**One question:** is there a real, named isolation setup — and has the owner approved this run?

## Sources read

- NIST SP 800-83 Rev.1 (2013), §4.2.4 *Malware Analysis* (active analysis on an isolated test
  system), §4.3 containment, §4.4 eradication, §4.5 recovery — read 2026-11-10.
- NIST SP 800-86 (2006), §3.1–3.5, the four-phase forensic process — read 2026-11-10.
- OWASP MASTG — read 2026-11-06 for the `ethical-hc` agent; used here for mobile dynamic checks.
- The brief's isolation rule — read 2026-11-10.

**Not read:** *Practical Malware Analysis* (the book) — the lab chapter was not read, so this
skill makes no claim from it. The checklist below comes from the brief and NIST, not from that book.

## When to load

After static analysis, only when `scope.md` names a real lab and the owner has approved execution.
If there is no lab, load it only to state the stop and offer static analysis.

## The gate

A real lab is an existing VM, container, or sandbox that is **actually isolated**:

- no host filesystem shares;
- no bridged network;
- a snapshot taken before the run;
- a way to destroy or revert it afterwards;
- no network for a suspicious sample unless the engagement explicitly allows a controlled network
  and the owner approves it.

**Not a lab:** a folder, a `chroot`, a Docker container with `--privileged`, a "safe" user account,
or a separate process on the host.

If you cannot point to the real isolation, **do not run the sample**. Stop and say what is missing.
Static analysis may continue.

## Steps

1. **Write the lab facts in `scope.md`:** platform (VM/container/sandbox), host, snapshot name,
   network mode, teardown method, approver, and date.

2. **Verify the isolation before the sample is present.** Check the shares, the network mode, and
   the snapshot. If you cannot verify a fact, treat the lab as absent.

3. **Take a snapshot.** Record its name and the time.

4. **Get explicit approval for this run.** One approval covers one run. A previous approval does not
   carry over.

5. **Transfer the sample into the lab.** Never execute it on the host. Record the SHA-256 inside the
   lab and compare it with `sample.md`.

6. **Observe and capture:** processes and command lines, files created or changed, registry or
   configuration changes, network connections, persistence, and timing. Keep the capture in
   `evidence/`.

7. **Stop on live malware or C2.** Disconnect the lab, take a snapshot, and do not let the sample
   reach the internet. Report the stop.

8. **Revert or destroy the lab.** Record what was observed and what was not. A run without a
   teardown is not finished.

9. **Write the notes in `analysis.md`.** Separate what was observed from what is inferred.

## Gates

- No named, verified lab: stop.
- No approval for this run: wait.
- No network unless controlled and approved.
- Never execute on the host.
- Never modify the original sample.
- Stop on live malware or C2.

## Outputs

- Dynamic notes in `analysis.md`.
- Evidence captures in `evidence/`.
- A teardown record.

## Failure

If the lab is absent, say so and offer static analysis only. If the lab is present but a fact cannot
be verified, say which fact and stop. Do not invent isolation, and do not treat a container with
host access as a lab.

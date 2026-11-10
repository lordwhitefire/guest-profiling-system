---
name: re-static-analysis
description: "Map a source tree, binary, APK, JS bundle, or firmware image without running it: identify structure, headers, sections, imports, symbols, strings, and entry points; record evidence; state what needs a disassembler or a missing tool."
---

# RE static analysis

**One question:** what can I learn from this artefact without executing it?

## Sources read

- *Practical Binary Analysis* (Andriesse), Chapter 5, "Basic Binary Analysis in Linux" — the free
  sample chapter from No Starch Press, read 2026-11-10. It covers `file`, `xxd`, `readelf`, ELF
  headers, sections, and symbols.
- Local `objdump --help`, `readelf --help`, `nm --help`, and `strings --help` — read 2026-11-10.
- NIST SP 800-86 (2006), §3.2–3.3, collection and examination — read 2026-11-10.
- OWASP MASTG — read 2026-11-06 for the `ethical-hc` agent; used here for mobile static checks.
- The `code-search` README and JSON contract — read 2026-11-10.

**Not read:** *The Ghidra Book*, *The IDA Pro Book*, and *The Radare2 Book* — the tools are not
installed, so this skill makes no tool claim from them. *Practical Malware Analysis* (the book) was
not read in full.

## When to load

After `re-triage`, when the target is source, a binary, an APK, a JS bundle, or firmware, and the
question is what it contains or how it is structured. Static analysis is allowed even when no lab
exists.

## Inputs

- `scope.md` and `sample.md` from triage.
- The original target. Work from a copy where practical; never modify the original.

## Steps

1. **Confirm the gate.** `scope.md` exists, ownership is recorded, and static analysis is allowed.

2. **Source tree.** Use `rg` for terms and `ast-grep` for known symbols. Read the entry points,
   routes, configuration, authentication, data access, and tests. Use `code-search` only when you
   need to see how public code implements a capability; it is not evidence about this target.

3. **Binary.** Start with identity, then structure, then code:

   ```bash
   file <target>
   readelf -h -l -S -s <target>     # ELF header, segments, sections, symbols
   objdump -f -h -p <target>        # file, section, and private headers
   objdump -d <target>              # disassemble executable sections
   nm -C <target>                   # symbols, demangled
   strings -a -n 4 <target>         # printable strings
   xxd -l 128 <target>              # magic bytes and header
   ```

   Record the architecture, endianness, linkage (static/dynamic), stripped/unstripped, section
   names, imports, exports, and strings that name files, hosts, commands, or errors.

4. **APK.** Decode resources and the manifest; do not run the app:

   ```bash
   unzip -l <target>
   apktool d -f -o re/<slug>/<date>/evidence/apktool <target>
   ```

   Decode into `re/<slug>/<date>/evidence/apktool`, never into the original tree. `jadx` is **not
   installed**. Say so if Java decompilation is needed. Do not pretend `apktool` output is Java
   source.

5. **JS bundle.** Look for the entry point, source maps, bundled URLs, and API routes. Use
   `node --check` for syntax only. Never execute the bundle.

6. **Firmware.** `binwalk` is **not installed**. Use `file`, `strings`, `xxd`, and `unzip` where the
   format allows. Do not emulate or flash anything.

7. **Map before you conclude.** List the entry points and the functions or classes that matter to
   the question. Mark what cannot be determined without a disassembler or decompiler.

8. **Record evidence.** For every claim, save the command and the relevant output excerpt under
   `evidence/`, with the file and line where it applies. Write the working notes in `analysis.md`.

## Gates

- Never execute the sample, the APK, the bundle, or the firmware.
- Never modify the original.
- No network access from the sample.
- Do not unpack in a way that runs code.
- If a tool is missing, say which one and what it would add. Do not substitute a guess.

## Outputs

- Notes in `analysis.md`.
- Command outputs, excerpts, hashes, and screenshots in `evidence/`.
- A clear list of open questions that need dynamic analysis or a missing tool.

## Failure

If the target cannot be read, say why. If a format needs a tool that is not installed, say so. Do
not claim a decompilation, a function map, or a behaviour that was not observed.

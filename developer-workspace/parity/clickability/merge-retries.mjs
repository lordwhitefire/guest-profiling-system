// Merge clickpass.json + all clickpass-retry-*.json files into one
// authoritative clickpass.json, then check coverage against map.json.
//
// Identity is not the label. The map repeats labels ("Invite User",
// "View permissions", "(icon)") on purpose; keying by label collapses real
// controls. A control is identified by route + scope + id, with shell rows
// normalized to scope "shell" because the shell map was captured on /search.
//
// Retry verdicts take precedence when they actually ran. A retry that could
// not find the control does not erase the full-pass evidence.
//
// Run from the repo:
//   node developer-workspace/parity/clickability/merge-retries.mjs

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR =
  process.env.CLICKPASS_DIR ??
  fileURLToPath(new URL(".", import.meta.url));

function load(name) {
  return JSON.parse(readFileSync(join(DIR, name), "utf8"));
}

function isShellLike(row) {
  return row.scope === "shell" || row.scope === "notifications" || row.scope === "contract";
}

function canonicalKey(row) {
  if (isShellLike(row)) {
    return `shell::${row.id || `label:${row.label}`}`;
  }
  return `${row.route}::${row.scope}::${row.id}`;
}

function verdictRank(verdict) {
  return { PASS: 5, FAKE: 4, DEAD: 3, NATIVE: 2, "NOT RUN": 1 }[verdict] ?? 0;
}

const map = load("map.json");
const mapRows = [...map.shell, ...map.pages];
const mapKeys = new Set(mapRows.map(canonicalKey));

const full = load("clickpass.json");

// Deduplicate the full pass first. The login capture contains an exact
// duplicate of page-3: one NATIVE and one NOT RUN. Keep the stronger verdict.
const deduped = [];
const dedupeIndex = new Map();
for (const row of full.results) {
  const signature = `${canonicalKey(row)}::${row.label}`;
  const existing = dedupeIndex.get(signature);
  if (existing === undefined) {
    dedupeIndex.set(signature, deduped.length);
    deduped.push(row);
    continue;
  }
  const current = deduped[existing];
  if (verdictRank(row.verdict) > verdictRank(current.verdict)) {
    deduped[existing] = row;
  }
}
full.results = deduped;

const byKey = new Map();
full.results.forEach((row, index) => {
  const key = canonicalKey(row);
  const list = byKey.get(key) ?? [];
  list.push(index);
  byKey.set(key, list);
});

const retryFiles = readdirSync(DIR)
  .filter((f) => /^clickpass-retry-.*\.json$/.test(f))
  .sort();

const unmatchedRetryKeys = new Set();
let replaced = 0;
let appended = 0;
const auditTrail = [];

for (const file of retryFiles) {
  const data = load(file);
  for (const retry of data.results) {
    const key = canonicalKey(retry);
    const reason = retry.reason || "";
    if (retry.verdict === "NOT RUN" && reason === "not found in live DOM") {
      unmatchedRetryKeys.add(key);
    }

    const candidates = byKey.get(key) ?? [];
    const matchIndex =
      candidates.find((index) => full.results[index].label === retry.label) ??
      candidates[0];

    if (matchIndex !== undefined) {
      const previous = full.results[matchIndex];
      const actionable = ["PASS", "FAKE", "DEAD", "NATIVE"].includes(retry.verdict);
      if (actionable) {
        auditTrail.push({
          key,
          label: retry.label,
          from: previous.verdict,
          to: retry.verdict,
          source: file,
        });
        full.results[matchIndex] = {
          ...previous,
          verdict: retry.verdict,
          reason: retry.reason,
          urlBefore: retry.urlBefore ?? previous.urlBefore,
          urlAfter: retry.urlAfter ?? previous.urlAfter,
          toasts: retry.toasts ?? previous.toasts,
          requests: retry.requests ?? previous.requests,
          responses: retry.responses ?? previous.responses,
          downloads: retry.downloads ?? previous.downloads,
          retrySource: file,
        };
        replaced++;
      } else {
        auditTrail.push({
          key,
          label: retry.label,
          from: previous.verdict,
          to: `${retry.verdict} (retry; not applied)`,
          source: file,
        });
        full.results[matchIndex] = {
          ...previous,
          retryAttempted: file,
          retryVerdict: retry.verdict,
          retryReason: retry.reason,
        };
      }
      continue;
    }

    full.results.push({ ...retry, retrySource: file });
    byKey.set(key, [full.results.length - 1]);
    auditTrail.push({
      key,
      label: retry.label,
      from: "(absent)",
      to: retry.verdict,
      source: file,
    });
    appended++;
  }
}

const counts = { PASS: 0, DEAD: 0, FAKE: 0, NATIVE: 0, "NOT RUN": 0 };
for (const row of full.results) {
  const verdict = row.verdict in counts ? row.verdict : "NOT RUN";
  counts[verdict]++;
}
full.counts = counts;

const resultKeys = new Set(full.results.map(canonicalKey));
const missingMap = mapRows.filter((row) => !resultKeys.has(canonicalKey(row)));
const extraRows = full.results.filter((row) => !mapKeys.has(canonicalKey(row)));

let unmatchedAnnotated = 0;
for (const row of full.results) {
  if (unmatchedRetryKeys.has(canonicalKey(row))) {
    row.flaggedUnmatched = true;
    unmatchedAnnotated++;
  }
}

writeFileSync(join(DIR, "clickpass.json"), JSON.stringify(full, null, 2) + "\n");

const lines = [];
lines.push("# clickpass.json — merged (id-based identity)");
lines.push("");
lines.push(`Merged: ${new Date().toISOString()}`);
lines.push(`Source files: clickpass.json + ${retryFiles.length} retry files`);
lines.push("");
lines.push("## Final counts");
lines.push("");
lines.push("| Verdict | Count |");
lines.push("|---|---:|");
for (const [key, value] of Object.entries(counts)) {
  lines.push(`| ${key} | ${value} |`);
}
lines.push(`| **TOTAL** | **${full.results.length}** |`);
lines.push("");
lines.push("## Map coverage");
lines.push("");
lines.push(`- Map rows: **${mapRows.length}**`);
lines.push(`- Rows covered: **${mapRows.length - missingMap.length}**`);
lines.push(`- Missing from audit: **${missingMap.length}**`);
lines.push(`- Rows in audit but not in map: **${extraRows.length}**`);
lines.push("");
if (missingMap.length > 0) {
  lines.push("| Missing route | Scope | Id | Label |");
  lines.push("|---|---|---|---|");
  for (const row of missingMap) {
    lines.push(`| ${row.route} | ${row.scope} | ${row.id} | ${row.label} |`);
  }
  lines.push("");
}
if (extraRows.length > 0) {
  lines.push("| Extra route | Scope | Id | Label |");
  lines.push("|---|---|---|---|");
  for (const row of extraRows) {
    lines.push(`| ${row.route} | ${row.scope} | ${row.id} | ${row.label} |`);
  }
  lines.push("");
}
lines.push("## Retry merge");
lines.push("");
lines.push(`- Replaced (retry overrode a full-pass verdict): **${replaced}**`);
lines.push(`- Appended (retry added a row the full pass never reached): **${appended}**`);
lines.push(`- Retries that could not find the control in live DOM: **${unmatchedAnnotated}**`);
lines.push("");
lines.push("## Verdict transitions");
lines.push("");
lines.push("| Key | Label | From | To | Retry source |");
lines.push("|---|---|---|---|---|");
for (const transition of auditTrail) {
  lines.push(
    `| ${transition.key} | ${transition.label} | ${transition.from} | ${transition.to} | ${transition.source} |`
  );
}
lines.push("");
lines.push("## Unmatched retry rows (need direct locator fix)");
lines.push("");
if (unmatchedRetryKeys.size === 0) {
  lines.push("_None._");
} else {
  lines.push("| Route | Scope | Id | Label |");
  lines.push("|---|---|---|---|");
  for (const row of full.results) {
    if (row.flaggedUnmatched) {
      lines.push(`| ${row.route} | ${row.scope} | ${row.id} | ${row.label} |`);
    }
  }
}
writeFileSync(join(DIR, "clickpass-merge-audit.md"), lines.join("\n") + "\n");

console.log("Merge complete.");
console.log("Final counts:", counts);
console.log(`Total rows: ${full.results.length}`);
console.log(
  `Map coverage: ${mapRows.length - missingMap.length}/${mapRows.length}; missing ${missingMap.length}; extra ${extraRows.length}`
);
console.log(`Replaced: ${replaced}, Appended: ${appended}, Unmatched retries: ${unmatchedAnnotated}`);

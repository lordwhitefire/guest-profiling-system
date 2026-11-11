// =============================================================================
// Fill orchestrator — the three-stage pipeline
// =============================================================================
// Per Card 5 §7.1: "scan → score → solve → set. No shortcuts."
//
// This module ties together:
//   1. scanner.ts → FieldSignals[]
//   2. scorer.ts → ScoredCandidate[]
//   3. hungarian-solver.ts → SolverAssignment[]
//   4. native-setter.ts → writes to the DOM
//
// The orchestrator is the single entry point called by the content script
// when the receptionist clicks "Fill form" in the popup.

import { scanDocument, type FieldSignals } from "../matching/scanner.js";
import { scoreAllPairs, type Rules, type Rule, type ScoredCandidate, LOW_THRESHOLD, HIGH_THRESHOLD } from "../matching/scorer.js";
import { solveAssignment, type SolverAssignment } from "../matching/hungarian-solver.js";
import { setValue, type SetResult } from "./native-setter.js";

export interface FillRequest {
  /** The guest profile data, flattened to key → value (e.g. { firstName: "John", ... }). */
  profile: Record<string, unknown>;
  /** The rules dictionary (rules.json content). Defaults to the bundled one. */
  rules?: Rules;
  /** Whether to fill high-confidence matches silently (true) or always prompt (false). */
  autoFillHighConfidence?: boolean;
}

export interface FillResult {
  /** Total fields scanned. */
  totalFields: number;
  /** Total candidates above LOW_THRESHOLD before solving. */
  totalCandidates: number;
  /** Total assignments (one per field, possibly with sentinel padding). */
  totalAssignments: number;
  /** Real (non-sentinel) assignments. */
  realAssignments: number;
  /** High-confidence fills (score >= HIGH_THRESHOLD). */
  highConfidenceFills: number;
  /** Medium-confidence fills (LOW_THRESHOLD <= score < HIGH_THRESHOLD). */
  mediumConfidenceFills: number;
  /** Results from the native setter. */
  writeResults: SetResult[];
  /** Total pipeline duration in milliseconds. */
  durationMs: number;
  /** The scanned fields (kept for the popup to display). */
  fields: FieldSignals[];
  /** The solved assignments (kept for the popup to display). */
  assignments: SolverAssignment[];
  /** The scored candidates above LOW_THRESHOLD. */
  candidates: ScoredCandidate[];
}

/**
 * Run the full three-stage fill pipeline on the current document.
 *
 * @returns A summary of what was scanned, scored, solved, and written.
 *          The popup uses this to display what was filled and what needs
 *          confirmation.
 */
export async function fillForm(req: FillRequest): Promise<FillResult> {
  const startTime = Date.now();

  // Load rules — either the ones provided, or the bundled default.
  const rules = req.rules ?? await loadDefaultRules();

  // ── Stage 1: Scan ─────────────────────────────────────────────────────
  const fields = scanDocument(document.body);

  // ── Stage 2: Score ────────────────────────────────────────────────────
  const candidates = scoreAllPairs(fields, rules);

  // ── Stage 3: Solve ────────────────────────────────────────────────────
  const keys = Array.from(new Set(candidates.map((c) => c.key)));
  const solverResult = solveAssignment(candidates, fields.length, keys);

  // ── Stage 4: Set ──────────────────────────────────────────────────────
  const writeResults: SetResult[] = [];
  let highConfidenceFills = 0;
  let mediumConfidenceFills = 0;

  for (const assignment of solverResult.assignments) {
    if (!assignment.real) continue;
    if (assignment.score < LOW_THRESHOLD) continue;

    const value = req.profile[assignment.key];
    if (value === undefined || value === null) continue;

    const field = fields[assignment.fieldIndex];
    if (!field) continue;

    const valueStr = String(value);
    const result = setValue(field.element, valueStr);
    writeResults.push(result);

    if (assignment.score >= HIGH_THRESHOLD) {
      highConfidenceFills++;
    } else {
      mediumConfidenceFills++;
    }
  }

  return {
    totalFields: fields.length,
    totalCandidates: candidates.length,
    totalAssignments: solverResult.assignments.length,
    realAssignments: solverResult.assignments.filter((a) => a.real).length,
    highConfidenceFills,
    mediumConfidenceFills,
    writeResults,
    durationMs: Date.now() - startTime,
    fields,
    assignments: solverResult.assignments,
    candidates,
  };
}

/**
 * Load the default rules.json. In the content script, this is bundled by
 * esbuild via `import rules from "../../rules/rules.json"`. In tests, we
 * pass the rules directly via FillRequest.rules.
 */
async function loadDefaultRules(): Promise<Rules> {
  // Dynamic import — esbuild bundles JSON imports statically
  try {
    const mod = await import("../../rules/rules.json");
    const raw = mod.default as Record<string, unknown>;
    // Filter out the "_meta" key (not a rule — it's documentation)
    const out: Rules = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key === "_meta") continue;
      out[key] = value as Rule;
    }
    return out;
  } catch {
    console.warn("[adapter-fill] Could not load default rules.json — no rules applied");
    return {};
  }
}

/** Thresholds re-exported for the popup. */
export { LOW_THRESHOLD, HIGH_THRESHOLD };

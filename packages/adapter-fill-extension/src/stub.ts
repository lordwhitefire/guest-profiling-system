// =============================================================================
// @gps/adapter-fill-extension — STUB
// =============================================================================
// TASK-006 will implement Card 5's three-stage pipeline here:
//   1. Scanner + Normalizer — DOM walker; detects input/select/textarea;
//      extracts 5 signals (label, placeholder, name, id, legend);
//      tokenizer + abbreviations dictionary
//   2. Hungarian Solver — Kuhn-Munkres on cost matrix (max_score - score);
//      O(dim^3); uniform sentinel for non-candidates; de-duplication of output
//   3. Framework Setter — Native prototype setter bypass for React/Vue/Angular;
//      dispatch input + change events with bubbles=true, composed=true;
//      inputType="insertReplacementText"; pristine-iframe fallback
//
// Per Behavioral Specification Card 5 Section 7.2, the scorer:
//   exact phrase +35, regex +20, fuzzy similarity × 15 if > 0.6,
//   autocomplete +45, block context +15, negative −40
//   Source weights: label 1.0, placeholder 0.9, name 0.8, id 0.7, legend 0.6
//   Take max across sources
//
// This stub exists so the monorepo workspace is complete. Implementation lands
// in TASK-006.

console.error("[adapter-fill-extension] TASK-006 not yet implemented.");

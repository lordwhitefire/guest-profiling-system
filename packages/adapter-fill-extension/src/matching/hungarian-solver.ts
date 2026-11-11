// =============================================================================
// Kuhn-Munkres (Hungarian) solver — maximum-weight bipartite matching
// =============================================================================
// Per Card 5 §7.3: "builds a cost matrix where rows are form fields and
// columns are candidate profile keys. Each cell's score is computed by the
// signal scorer. The matrix is then solved by the Kuhn-Munkres algorithm
// for maximum-weight bipartite matching."
//
// Critical correctness property (Card 5 §7.3):
//   "Because every non-candidate cell (a genuine 'field X has nothing to do
//    with key Y', or pure structural padding) costs exactly the same, total
//    cost over any perfect matching always decomposes as (matrix size) ×
//    (sentinel) − (sum of scores used). Minimizing that is identical to
//    maximizing total matched score, so a field with a genuine candidate
//    is never displaced by one that lacks one."
//
// Implementation notes:
//   - We solve MIN-cost by negating the score (cost = max_score - score)
//   - Padding cells use a uniform sentinel cost = max_score (so they're
//     equally unattractive and never displace real candidates)
//   - O(dim³) — fine for forms of tens to low hundreds of fields

import type { ScoredCandidate } from "./scorer.js";

export interface SolverAssignment {
  fieldIndex: number;
  key: string;
  score: number;
  /** True if this assignment is a real candidate; false if it's sentinel padding. */
  real: boolean;
}

export interface SolverResult {
  /** The matched assignments (one per field, possibly with sentinel padding). */
  assignments: SolverAssignment[];
  /** Total score across real assignments only. */
  totalScore: number;
  /** Matrix dimensions (rows × cols). */
  rows: number;
  cols: number;
}

/**
 * A sentinel "no relationship" cost used for padding cells.
 *
 * Per Card 5 §7.3: every non-candidate cell costs exactly the same. We use
 * a value that's larger than any real score (so it's never preferred over a
 * real candidate) but finite (so the solver's math doesn't break).
 */
const SENTINEL_COST = 1000;

/**
 * Solve the field-to-key assignment as a minimum-cost perfect matching on
 * a bipartite graph.
 *
 * @param candidates List of (fieldIndex, key, score) candidates from the scorer
 * @param numFields  Total number of form fields (rows)
 * @param keys       List of all distinct candidate keys (columns)
 * @returns          SolverResult with one assignment per field
 */
export function solveAssignment(
  candidates: ScoredCandidate[],
  numFields: number,
  keys: string[],
): SolverResult {
  if (numFields === 0 || keys.length === 0) {
    return { assignments: [], totalScore: 0, rows: 0, cols: 0 };
  }

  const numKeys = keys.length;
  const dim = Math.max(numFields, numKeys);

  // Build a map for quick score lookup: (fieldIndex, key) → score
  const scoreMap = new Map<string, number>();
  for (const c of candidates) {
    const k = `${c.fieldIndex}|${c.key}`;
    // Collapse duplicates to the best score (Card 5 §7.3 "defensive behaviors")
    const existing = scoreMap.get(k);
    if (existing === undefined || c.score > existing) {
      scoreMap.set(k, c.score);
    }
  }

  // Build cost matrix. Cost = max_score - score. Padding cells get SENTINEL_COST.
  // We use a high enough "max_score" that real scores always produce lower
  // cost than the sentinel. We use 100 as the practical max (since scorer
  // returns values typically in 0-150 range).
  const PRACTICAL_MAX_SCORE = 200;
  const costMatrix: number[][] = Array.from({ length: dim }, () =>
    new Array<number>(dim).fill(SENTINEL_COST),
  );
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      if (r < numFields && c < numKeys) {
        const score = scoreMap.get(`${r}|${keys[c]!}`) ?? 0;
        // Card 5 §7.3: "non-finite scores (NaN, Infinity) are dropped before
        // matrix construction". A score of 0 (below LOW_THRESHOLD, filtered
        // by the scorer) is treated as a non-candidate → sentinel cost.
        if (score > 0 && Number.isFinite(score)) {
          costMatrix[r]![c] = PRACTICAL_MAX_SCORE - score;
        }
        // Else: SENTINEL_COST (already initialized)
      }
    }
  }

  // Solve minimum-cost perfect matching via Kuhn-Munkres
  const assignment = hungarian(costMatrix);

  // Convert to SolverAssignment[]
  const out: SolverAssignment[] = [];
  let totalScore = 0;
  for (let r = 0; r < numFields; r++) {
    const c = assignment[r]!;
    if (c < numKeys) {
      const score = scoreMap.get(`${r}|${keys[c]!}`) ?? 0;
      const real = score > 0 && Number.isFinite(score);
      out.push({
        fieldIndex: r,
        key: keys[c]!,
        score,
        real,
      });
      if (real) totalScore += score;
    } else {
      // Sentinel — field has no real candidate
      out.push({
        fieldIndex: r,
        key: "",
        score: 0,
        real: false,
      });
    }
  }

  return {
    assignments: out,
    totalScore,
    rows: numFields,
    cols: numKeys,
  };
}

/**
 * Kuhn-Munkres (Hungarian) algorithm — minimum-cost perfect matching.
 *
 * Standard O(n³) implementation using the potential method. Returns an
 * array `result` where `result[row] = col` is the assigned column for each
 * row.
 *
 * Reference: Bourgeois' / Jonker-Volgenant-style O(n³) variant. We use the
 * simpler Jonker-Volgenant formulation that's well-known to be correct.
 *
 * Cost matrix must be square. Non-square matrices should be padded by the
 * caller (we pad above with SENTINEL_COST).
 */
function hungarian(cost: number[][]): number[] {
  const n = cost.length;
  if (n === 0) return [];

  // Edge case: 1×1 matrix
  if (n === 1) return [0];

  // Initialize potentials
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);  // p[col] = row assigned to col
  const way = new Array<number>(n + 1).fill(0);

  for (let row = 1; row <= n; row++) {
    p[0] = row;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(Infinity);
    const used = new Array<boolean>(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0]!;
      let delta = Infinity;
      let j1 = -1;

      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = cost[i0 - 1]![j - 1]! - u[i0]! - v[j]!;
          if (cur < minv[j]!) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j]! < delta) {
            delta = minv[j]!;
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          const pVal = p[j]!;
          u[pVal] = (u[pVal] ?? 0) + delta;
          v[j] = (v[j] ?? 0) - delta;
        } else {
          minv[j] = (minv[j] ?? 0) - delta;
        }
      }

      j0 = j1!;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0]!;
      p[j0] = p[j1]!;
      j0 = j1;
    } while (j0 !== 0);
  }

  // Convert: result[row-1] = col-1
  const result = new Array<number>(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    if (p[j] !== 0) {
      result[p[j]! - 1] = j - 1;
    }
  }
  return result;
}

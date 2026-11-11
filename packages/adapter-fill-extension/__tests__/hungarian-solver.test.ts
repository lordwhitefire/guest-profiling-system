// =============================================================================
// Kuhn-Munkres solver tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { solveAssignment } from "../src/matching/hungarian-solver.js";
import type { ScoredCandidate } from "../src/matching/scorer.js";

describe("hungarian-solver — basic cases", () => {
  it("returns empty result for empty inputs", () => {
    const result = solveAssignment([], 0, []);
    expect(result.assignments).toEqual([]);
    expect(result.totalScore).toBe(0);
    expect(result.rows).toBe(0);
    expect(result.cols).toBe(0);
  });

  it("returns empty result when there are no keys", () => {
    const result = solveAssignment([], 5, []);
    expect(result.assignments).toEqual([]);
    expect(result.totalScore).toBe(0);
  });

  it("returns empty result when there are no fields", () => {
    const result = solveAssignment([], 0, ["firstName", "lastName"]);
    expect(result.assignments).toEqual([]);
  });
});

describe("hungarian-solver — single field, single key", () => {
  it("assigns the field to the key when score is positive", () => {
    const candidates: ScoredCandidate[] = [
      { fieldIndex: 0, key: "firstName", score: 80, highConfidence: true, needsConfirmation: false },
    ];
    const result = solveAssignment(candidates, 1, ["firstName"]);
    expect(result.assignments.length).toBe(1);
    expect(result.assignments[0]!.fieldIndex).toBe(0);
    expect(result.assignments[0]!.key).toBe("firstName");
    expect(result.assignments[0]!.real).toBe(true);
    expect(result.totalScore).toBe(80);
  });
});

describe("hungarian-solver — perfect matching (square matrix)", () => {
  it("assigns each field to its best-matching key", () => {
    const candidates: ScoredCandidate[] = [
      // Field 0: firstName score=80, lastName score=20
      { fieldIndex: 0, key: "firstName", score: 80, highConfidence: true, needsConfirmation: false },
      { fieldIndex: 0, key: "lastName", score: 20, highConfidence: false, needsConfirmation: false },
      // Field 1: firstName score=20, lastName score=80
      { fieldIndex: 1, key: "firstName", score: 20, highConfidence: false, needsConfirmation: false },
      { fieldIndex: 1, key: "lastName", score: 80, highConfidence: true, needsConfirmation: false },
    ];
    const result = solveAssignment(candidates, 2, ["firstName", "lastName"]);
    expect(result.assignments.length).toBe(2);
    // The optimal assignment is field 0 → firstName, field 1 → lastName
    const a0 = result.assignments.find((a) => a.fieldIndex === 0)!;
    const a1 = result.assignments.find((a) => a.fieldIndex === 1)!;
    expect(a0.key).toBe("firstName");
    expect(a1.key).toBe("lastName");
    expect(result.totalScore).toBe(160);
  });
});

describe("hungarian-solver — sentinel padding", () => {
  it("leaves a field without a real candidate as sentinel (real=false)", () => {
    const candidates: ScoredCandidate[] = [
      // Only field 0 has a candidate; field 1 has nothing above LOW_THRESHOLD
      { fieldIndex: 0, key: "firstName", score: 80, highConfidence: true, needsConfirmation: false },
    ];
    const result = solveAssignment(candidates, 2, ["firstName"]);
    expect(result.assignments.length).toBe(2);
    const a0 = result.assignments.find((a) => a.fieldIndex === 0)!;
    const a1 = result.assignments.find((a) => a.fieldIndex === 1)!;
    expect(a0.real).toBe(true);
    expect(a0.key).toBe("firstName");
    expect(a1.real).toBe(false);
    expect(a1.key).toBe("");  // sentinel
    expect(result.totalScore).toBe(80);
  });
});

describe("hungarian-solver — defensive behaviors (Card 5 §7.3)", () => {
  it("collapses duplicate (field, key) pairs to the best score", () => {
    const candidates: ScoredCandidate[] = [
      { fieldIndex: 0, key: "firstName", score: 50, highConfidence: false, needsConfirmation: true },
      { fieldIndex: 0, key: "firstName", score: 80, highConfidence: true, needsConfirmation: false },
      { fieldIndex: 0, key: "firstName", score: 30, highConfidence: false, needsConfirmation: true },
    ];
    const result = solveAssignment(candidates, 1, ["firstName"]);
    expect(result.assignments[0]!.score).toBe(80);
    expect(result.totalScore).toBe(80);
  });
});

describe("hungarian-solver — non-square matrix", () => {
  it("pads to square when there are more fields than keys", () => {
    // 3 fields, 2 keys → matrix padded to 3×3
    const candidates: ScoredCandidate[] = [
      { fieldIndex: 0, key: "firstName", score: 80, highConfidence: true, needsConfirmation: false },
      { fieldIndex: 1, key: "lastName", score: 70, highConfidence: true, needsConfirmation: false },
      // Field 2 has no real candidate
    ];
    const result = solveAssignment(candidates, 3, ["firstName", "lastName"]);
    expect(result.assignments.length).toBe(3);
    const realAssignments = result.assignments.filter((a) => a.real);
    expect(realAssignments.length).toBe(2);
    expect(result.totalScore).toBe(150);
  });

  it("pads to square when there are more keys than fields", () => {
    // 2 fields, 3 keys → matrix padded to 3×3
    const candidates: ScoredCandidate[] = [
      { fieldIndex: 0, key: "firstName", score: 80, highConfidence: true, needsConfirmation: false },
      { fieldIndex: 1, key: "lastName", score: 70, highConfidence: true, needsConfirmation: false },
    ];
    const result = solveAssignment(candidates, 2, ["firstName", "lastName", "email"]);
    expect(result.assignments.length).toBe(2);
    const realAssignments = result.assignments.filter((a) => a.real);
    expect(realAssignments.length).toBe(2);
    expect(result.totalScore).toBe(150);
  });
});

describe("hungarian-solver — global optimality (Card 5 §7.3)", () => {
  it("finds the global maximum when local-greedy would pick a worse match", () => {
    // Classic test: field 0 matches both keys well, field 1 only matches one.
    // A naive greedy that picks the best for field 0 first would steal the
    // only key field 1 can use. The Hungarian algorithm finds the optimal.
    const candidates: ScoredCandidate[] = [
      // Field 0: firstName=80, lastName=70 (both well-matched)
      { fieldIndex: 0, key: "firstName", score: 80, highConfidence: true, needsConfirmation: false },
      { fieldIndex: 0, key: "lastName", score: 70, highConfidence: true, needsConfirmation: false },
      // Field 1: firstName=50, lastName=0 (only firstName matches at all)
      { fieldIndex: 1, key: "firstName", score: 50, highConfidence: false, needsConfirmation: true },
    ];
    const result = solveAssignment(candidates, 2, ["firstName", "lastName"]);
    // Optimal: field 0 → lastName (70), field 1 → firstName (50) = 120 total
    // Greedy would pick: field 0 → firstName (80), field 1 → lastName (0) = 80 total
    expect(result.totalScore).toBe(120);
    const a0 = result.assignments.find((a) => a.fieldIndex === 0)!;
    const a1 = result.assignments.find((a) => a.fieldIndex === 1)!;
    expect(a0.key).toBe("lastName");
    expect(a1.key).toBe("firstName");
  });
});

describe("hungarian-solver — stress test (performance)", () => {
  it("solves a 50×50 matrix in well under a second", () => {
    const candidates: ScoredCandidate[] = [];
    for (let f = 0; f < 50; f++) {
      for (let k = 0; k < 50; k++) {
        candidates.push({
          fieldIndex: f,
          key: `key${k}`,
          score: 30 + Math.floor(Math.random() * 50),
          highConfidence: false,
          needsConfirmation: true,
        });
      }
    }
    const keys = Array.from({ length: 50 }, (_, i) => `key${i}`);
    const start = Date.now();
    const result = solveAssignment(candidates, 50, keys);
    const elapsed = Date.now() - start;
    expect(result.assignments.length).toBe(50);
    expect(elapsed).toBeLessThan(1000);  // Card 5 §7.6: 500×200 < 1s; 50×50 should be much faster
  });
});

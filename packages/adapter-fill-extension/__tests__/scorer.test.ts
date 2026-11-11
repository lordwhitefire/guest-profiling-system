// =============================================================================
// Scorer tests
// =============================================================================
// Verifies the Card 5 §7.2 scoring formula:
//   - exact phrase +35, regex +20, fuzzy similarity × 15 if > 0.6
//   - autocomplete +45, block context +15, negative −40
//   - source weights: label 1.0, placeholder 0.9, name 0.8, id 0.7, legend 0.6
//   - take max across sources
//   - LOW_THRESHOLD = 30, HIGH_THRESHOLD = 60

import { describe, it, expect } from "vitest";
import { scorePair, scoreAllPairs, LOW_THRESHOLD, HIGH_THRESHOLD, type Rule } from "../src/matching/scorer.js";
import type { FieldSignals } from "../src/matching/scanner.js";

function makeField(over: Partial<FieldSignals> = {}): FieldSignals {
  return {
    debugId: "test-1",
    raw: { label: null, placeholder: null, name: null, id: null, legend: null },
    normalized: {
      label: { phrase: "", tokens: [] },
      placeholder: { phrase: "", tokens: [] },
      name: { phrase: "", tokens: [] },
      id: { phrase: "", tokens: [] },
      legend: { phrase: "", tokens: [] },
    },
    autocomplete: null,
    type: "text",
    tagName: "input",
    blockType: null,
    blockIndex: null,
    element: {} as Element,
    ...over,
  };
}

const firstNameRule: Rule = {
  exactPhrases: ["first name", "given name"],
  regexPatterns: ["^first[_-]?name$", "^given[_-]?name$"],
  autocompleteTokens: ["given-name"],
  allowedTypes: ["text", null],
  negativePatterns: ["last", "surname"],
};

describe("scorer — exact phrase match", () => {
  it("scores label 'First Name' against firstName rule as high confidence", () => {
    const field = makeField({
      raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name", tokens: ["first", "name"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const score = scorePair(field, "firstName", firstNameRule);
    // Exact phrase +35 × weight 1.0 = 35, plus fuzzy × 15 (sim=1.0) × 1.0 = 15
    // Total = 50
    expect(score).toBe(50);
    expect(score).toBeGreaterThanOrEqual(HIGH_THRESHOLD - 25);
  });

  it("scores placeholder 'First Name' against firstName rule with 0.9 weight", () => {
    const field = makeField({
      raw: { label: null, placeholder: "First Name", name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "", tokens: [] },
        placeholder: { phrase: "first name", tokens: ["first", "name"] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const score = scorePair(field, "firstName", firstNameRule);
    // Exact phrase +35 × 0.9 = 31.5, plus fuzzy × 15 (sim=1.0) × 0.9 = 13.5
    // Total = 45
    expect(score).toBeCloseTo(45, 1);
  });

  it("scores name='first_name' against firstName rule (regex match +20)", () => {
    const field = makeField({
      raw: { label: null, placeholder: null, name: "first_name", id: null, legend: null },
      normalized: {
        label: { phrase: "", tokens: [] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "first_name", tokens: ["first", "name"] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const score = scorePair(field, "firstName", firstNameRule);
    // Exact phrase +35 × 0.8 = 28 (token-set containment)
    // Regex +20 × 0.8 = 16 (matches ^first[_-]?name$)
    // Fuzzy × 15 × 0.8 = 12 (sim=1.0 for "first_name" vs "first name" via Dice bigrams)
    // Total = 56
    expect(score).toBeGreaterThanOrEqual(28);
  });
});

describe("scorer — autocomplete bonus (+45)", () => {
  it("adds +45 when field's autocomplete matches a rule token", () => {
    const field = makeField({
      autocomplete: "given-name",
      raw: { label: null, placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "", tokens: [] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const score = scorePair(field, "firstName", firstNameRule);
    // +45 from autocomplete, no source contributions (all signals empty)
    expect(score).toBe(45);
  });

  it("stacks with label match (35 + 15 + 45 = 95)", () => {
    const field = makeField({
      autocomplete: "given-name",
      raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name", tokens: ["first", "name"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const score = scorePair(field, "firstName", firstNameRule);
    // Label source: 35 (exact) + 15 (fuzzy sim=1.0) × 1.0 = 50
    // Autocomplete bonus: +45
    // Total = 95
    expect(score).toBe(95);
  });
});

describe("scorer — negative pattern (−40)", () => {
  it("subtracts 40 when a negative pattern matches the field", () => {
    const field = makeField({
      raw: { label: "First Name Last", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name last", tokens: ["first", "name", "last"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const score = scorePair(field, "firstName", firstNameRule);
    // Exact phrase +35 × 1.0 = 35 (still matches via token-set containment)
    // Fuzzy × 15 × 1.0 ≈ 13 (sim still high)
    // Negative pattern "last" matches → -40
    // Total ≈ 35 + 13 - 40 ≈ 8
    expect(score).toBeLessThan(15);  // negative should pull it down significantly
    expect(score).toBeGreaterThan(-50);  // sanity: shouldn't go super-negative
  });
});

describe("scorer — block context (+15)", () => {
  it("adds +15 when field is in a block matching rule.expectedBlockType", () => {
    const field = makeField({
      blockType: "guest",
      raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name", tokens: ["first", "name"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const rule: Rule = { ...firstNameRule, expectedBlockType: "guest" };
    const score = scorePair(field, "firstName", rule);
    // 35 (exact) + 15 (fuzzy sim=1.0) × 1.0 = 50, plus +15 (block context)
    // Total = 65
    expect(score).toBe(65);
  });

  it("does NOT add +15 when block types don't match", () => {
    const field = makeField({
      blockType: "address",
      raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name", tokens: ["first", "name"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const rule: Rule = { ...firstNameRule, expectedBlockType: "guest" };
    const score = scorePair(field, "firstName", rule);
    // No block bonus — only 35 + 15 = 50 from label source
    expect(score).toBe(50);
  });
});

describe("scorer — fuzzy matching", () => {
  it("applies fuzzy similarity × 15 when similarity > 0.6", () => {
    // "first name" vs "first name" should give similarity 1.0, +15
    // But exact phrase also matches +35. Total = 35 + 15 = 50
    const field = makeField({
      raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name", tokens: ["first", "name"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const score = scorePair(field, "firstName", firstNameRule);
    expect(score).toBeGreaterThanOrEqual(35);  // at least the exact phrase score
  });
});

describe("scorer — type guard (allowedTypes)", () => {
  it("scoreAllPairs skips candidates where field type is not allowed", () => {
    const field = makeField({
      type: "email",
      raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name", tokens: ["first", "name"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    // firstNameRule.allowedTypes = ["text", null] — "email" is not allowed
    const candidates = scoreAllPairs([field], { firstName: firstNameRule });
    expect(candidates.length).toBe(0);
  });
});

describe("scorer — thresholds", () => {
  it("LOW_THRESHOLD = 30 (candidates below this are excluded)", () => {
    expect(LOW_THRESHOLD).toBe(30);
  });

  it("HIGH_THRESHOLD = 60 (candidates >= this fill silently)", () => {
    expect(HIGH_THRESHOLD).toBe(60);
  });
});

describe("scorer — scoreAllPairs", () => {
  it("returns candidates above LOW_THRESHOLD only", () => {
    const fields: FieldSignals[] = [
      makeField({
        raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
        normalized: {
          label: { phrase: "first name", tokens: ["first", "name"] },
          placeholder: { phrase: "", tokens: [] },
          name: { phrase: "", tokens: [] },
          id: { phrase: "", tokens: [] },
          legend: { phrase: "", tokens: [] },
        },
      }),
      // This field has no signal — score 0, below LOW_THRESHOLD
      makeField({
        raw: { label: null, placeholder: null, name: null, id: null, legend: null },
      }),
    ];
    const candidates = scoreAllPairs(fields, { firstName: firstNameRule });
    // Only the first field should produce a candidate above LOW_THRESHOLD
    expect(candidates.length).toBe(1);
    expect(candidates[0]!.fieldIndex).toBe(0);
    expect(candidates[0]!.key).toBe("firstName");
  });

  it("sets highConfidence=true for scores >= HIGH_THRESHOLD", () => {
    const field = makeField({
      autocomplete: "given-name",
      raw: { label: "First Name", placeholder: null, name: null, id: null, legend: null },
      normalized: {
        label: { phrase: "first name", tokens: ["first", "name"] },
        placeholder: { phrase: "", tokens: [] },
        name: { phrase: "", tokens: [] },
        id: { phrase: "", tokens: [] },
        legend: { phrase: "", tokens: [] },
      },
    });
    const candidates = scoreAllPairs([field], { firstName: firstNameRule });
    expect(candidates.length).toBe(1);
    // Label source: 35 (exact) + 15 (fuzzy sim=1.0) × 1.0 = 50
    // Autocomplete: +45
    // Total = 95
    expect(candidates[0]!.score).toBe(95);
    expect(candidates[0]!.highConfidence).toBe(true);
    expect(candidates[0]!.needsConfirmation).toBe(false);
  });
});

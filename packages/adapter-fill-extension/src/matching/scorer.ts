// =============================================================================
// Scorer — Card 5 §7.2 scoring formula
// =============================================================================
// For each (form field, candidate profile key) pair, computes a score based on:
//   - Exact phrase match (lowercase, after tokenization): +35 points
//   - Regex pattern match: +20 points
//   - Fuzzy similarity (max Dice + Jaro-Winkler) × 15 if > 0.6
//   - Negative pattern match: −40 points
//   - Autocomplete token match (HTML autocomplete attribute matches a
//     rule.autocompleteTokens entry): +45 points (applied once, not per source)
//   - Block context bonus (field is in a repeated block whose type matches
//     the rule's expected block type): +15 points (applied once)
//
// Source weights (Card 5 §7.2 Table 15):
//   label       1.0
//   placeholder 0.9
//   name        0.8
//   id          0.7
//   legend      0.6
// Take the max across sources.
//
// LOW_THRESHOLD and HIGH_THRESHOLD (Card 5 §7.2) control confirmation flow:
//   - score < LOW_THRESHOLD: candidate is excluded from the cost matrix
//   - LOW_THRESHOLD ≤ score < HIGH_THRESHOLD: highlight amber, wait for click
//   - score ≥ HIGH_THRESHOLD: fill silently

import type { FieldSignals } from "./scanner.js";
import { maxFuzzySimilarity } from "./similarity.js";

export interface Rule {
  exactPhrases: string[];
  regexPatterns: string[];
  autocompleteTokens: string[];
  allowedTypes?: string[] | null;
  negativePatterns?: string[];
  sensitivityTier?: "standard" | "sensitive" | "critical";
  requiresOptIn?: boolean;
  optInKey?: string;
  expectedBlockType?: string;
}

export type Rules = Record<string, Rule>;

export const LOW_THRESHOLD = 30;
export const HIGH_THRESHOLD = 60;

export interface ScoredCandidate {
  fieldIndex: number;
  key: string;
  score: number;
  /** Whether the score is high enough to fill without confirmation. */
  highConfidence: boolean;
  /** Whether the score is above LOW_THRESHOLD but below HIGH_THRESHOLD. */
  needsConfirmation: boolean;
}

/**
 * Score a single (field, key) pair.
 *
 * The score is computed across all 5 sources, weighted per Card 5 §7.2.
 * The autocomplete and block-context bonuses are applied once (not per source)
 * because they're field-level properties, not source-level.
 */
export function scorePair(field: FieldSignals, key: string, rule: Rule): number {
  // ── Field-level bonuses (applied once) ─────────────────────────────────
  let bonus = 0;
  if (field.autocomplete && rule.autocompleteTokens.includes(field.autocomplete)) {
    bonus += 45;  // Card 5 §7.2: autocomplete +45
  }
  if (field.blockType && rule.expectedBlockType && field.blockType === rule.expectedBlockType) {
    bonus += 15;  // Card 5 §7.2: block context +15
  }

  // ── Per-source scoring (take max) ──────────────────────────────────────
  const sources: Array<{ signal: typeof field.raw[keyof typeof field.raw]; weight: number; normalized: { phrase: string; tokens: string[] } }> = [
    { signal: field.raw.label, weight: 1.0, normalized: field.normalized.label },
    { signal: field.raw.placeholder, weight: 0.9, normalized: field.normalized.placeholder },
    { signal: field.raw.name, weight: 0.8, normalized: field.normalized.name },
    { signal: field.raw.id, weight: 0.7, normalized: field.normalized.id },
    { signal: field.raw.legend, weight: 0.6, normalized: field.normalized.legend },
  ];

  let maxSourceScore = 0;
  for (const src of sources) {
    const sub = scoreSource(src.normalized, rule, src.weight);
    if (sub > maxSourceScore) maxSourceScore = sub;
  }

  // ── Negative patterns (applied per source) ─────────────────────────────
  // Card 5 §7.2: negative patterns disqualify the field. We apply the
  // −40 penalty if ANY negative pattern matches ANY non-empty source.
  let penalty = 0;
  if (rule.negativePatterns && rule.negativePatterns.length > 0) {
    for (const src of sources) {
      if (!src.signal) continue;
      const text = String(src.signal).toLowerCase();
      for (const pattern of rule.negativePatterns) {
        try {
          const re = new RegExp(pattern, "i");
          if (re.test(text)) {
            penalty = -40;
            break;
          }
        } catch {
          // Malformed regex — skip silently
        }
      }
      if (penalty === -40) break;
    }
  }

  return maxSourceScore + bonus + penalty;
}

/**
 * Score a single source against a rule.
 *
 * Returns the sub-score (before bonus and penalty). Sub-score is computed as:
 *   - Exact phrase match: +35 (then × source weight)
 *   - Regex pattern match: +20 (then × source weight)
 *   - Fuzzy similarity (max Dice + Jaro-Winkler) > 0.6: +similarity × 15
 *     (then × source weight)
 *
 * Per Card 5 §7.2: components are SUMMED within a source, then the source
 * sub-score is multiplied by the source weight. Take max across sources.
 */
function scoreSource(
  normalized: { phrase: string; tokens: string[] },
  rule: Rule,
  weight: number,
): number {
  if (normalized.phrase.length === 0) return 0;

  let sub = 0;

  // 1. Exact phrase match (lowercase, after tokenization): +35
  // Card 5 §7.2: "lowercase literal strings; +35 points if any matches the
  // tokenized source". The rule's exactPhrases are already lowercase literal
  // strings. We compare against the tokenized source's normalized phrase.
  // A match means the rule's phrase is a substring of the normalized source
  // phrase (or vice versa) — but we also do an exact equality check first
  // because that's the strictest interpretation.
  for (const phrase of rule.exactPhrases) {
    const p = phrase.toLowerCase().trim();
    if (p.length === 0) continue;
    // Strict equality
    if (normalized.phrase === p) {
      sub += 35;
      break;
    }
    // Substring containment (covers "First Name:" label → "first name")
    if (normalized.phrase.includes(p) || p.includes(normalized.phrase)) {
      sub += 35;
      break;
    }
    // Token-set containment (covers "Name First" → "first name")
    const phraseTokens = p.split(/\s+/).filter((t) => t.length > 0);
    if (phraseTokens.length > 0 && phraseTokens.every((t) => normalized.tokens.includes(t))) {
      sub += 35;
      break;
    }
  }

  // 2. Regex pattern match: +20
  for (const pattern of rule.regexPatterns) {
    try {
      const re = new RegExp(pattern, "i");
      if (re.test(normalized.phrase)) {
        sub += 20;
        break;
      }
    } catch {
      // Malformed regex — skip silently
    }
  }

  // 3. Fuzzy similarity × 15 if max similarity > 0.6
  let maxSim = 0;
  for (const phrase of rule.exactPhrases) {
    const p = phrase.toLowerCase().trim();
    if (p.length === 0) continue;
    const sim = maxFuzzySimilarity(normalized.phrase, p);
    if (sim > maxSim) maxSim = sim;
  }
  if (maxSim > 0.6) {
    sub += maxSim * 15;
  }

  return sub * weight;
}

/**
 * Score all (field, key) pairs.
 *
 * Returns a list of ScoredCandidate objects, one per (field, key) pair where
 * the score is above LOW_THRESHOLD. Candidates below LOW_THRESHOLD are
 * excluded per Card 5 §7.2.
 *
 * @param fields  The scanned form fields
 * @param rules   The rules dictionary (key → rule)
 * @returns       List of scored candidates above LOW_THRESHOLD
 */
export function scoreAllPairs(fields: FieldSignals[], rules: Rules): ScoredCandidate[] {
  const out: ScoredCandidate[] = [];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]!;
    for (const [key, rule] of Object.entries(rules)) {
      // Type guard: skip if rule.allowsTypes is set and the field's type
      // is not in the allowed list. null type means "any".
      if (rule.allowedTypes && rule.allowedTypes.length > 0) {
        const allowed = rule.allowedTypes.filter((t) => t !== null) as string[];
        if (allowed.length > 0 && !allowed.includes(field.type)) {
          continue;
        }
      }
      const score = scorePair(field, key, rule);
      if (score >= LOW_THRESHOLD) {
        out.push({
          fieldIndex: i,
          key,
          score: Math.round(score * 100) / 100,
          highConfidence: score >= HIGH_THRESHOLD,
          needsConfirmation: score >= LOW_THRESHOLD && score < HIGH_THRESHOLD,
        });
      }
    }
  }
  return out;
}

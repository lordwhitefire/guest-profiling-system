// =============================================================================
// Fuzzy similarity — Dice coefficient + Jaro-Winkler
// =============================================================================
// Per Card 5 §7.2: "Fuzzy similarity (max of Dice coefficient and
// Jaro-Winkler, against every exact phrase in the rule): if > 0.6,
// +max_similarity × 15 points"
//
// Both algorithms return a similarity score in [0, 1]. We take the MAX of
// the two (per the spec) so that Dice catches token-level similarity and
// Jaro-Winkler catches character-level similarity with prefix preference.

/**
 * Dice coefficient (Sørensen–Dice) on bigrams.
 *
 * For two strings, builds the set of character bigrams for each, then
 * computes 2 × |intersection| / (|A| + |B|).
 *
 * Examples:
 *   dice("first name", "first name") → 1.0
 *   dice("first name", "firstname")  → ~0.78 (tokenization done elsewhere)
 *   dice("email", "mail")            → ~0.33
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b && a.length > 0) return 1.0;
  if (a.length < 2 || b.length < 2) return 0.0;
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (bigramsA.size === 0 || bigramsB.size === 0) return 0.0;

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    out.add(s.slice(i, i + 2));
  }
  return out;
}

/**
 * Jaro-Winkler similarity.
 *
 * Standard implementation. Prefix-scaling factor p = 0.1, max prefix len = 4
 * (Winkler's defaults). Returns a value in [0, 1].
 *
 * Examples:
 *   jaroWinkler("first name", "first name") → 1.0
 *   jaroWinkler("martha", "marhta")          → ~0.961 (classic example)
 *   jaroWinkler("email", "phone")            → 0.0
 */
export function jaroWinkler(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) return 0.0;
  if (s1 === s2) return 1.0;

  const j = jaro(s1, s2);
  // Common prefix length, up to 4
  let prefixLen = 0;
  while (prefixLen < 4 && s1[prefixLen] === s2[prefixLen]) prefixLen++;
  return j + prefixLen * 0.1 * (1 - j);
}

function jaro(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0.0;
  if (s1 === s2) return 1.0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);
  let matches = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  transpositions = transpositions / 2;

  return (
    (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3
  );
}

/**
 * Take the max of Dice and Jaro-Winkler, per Card 5 §7.2.
 * Returns a value in [0, 1].
 */
export function maxFuzzySimilarity(a: string, b: string): number {
  return Math.max(diceCoefficient(a, b), jaroWinkler(a, b));
}

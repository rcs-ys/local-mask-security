import type {
  DetectedSpan,
  MergePolicy,
  MaskStats,
  PiiCategory,
  PatternBundle,
} from "../types.js";

function spansOverlap(a: DetectedSpan, b: DetectedSpan): boolean {
  return a.start < b.end && b.start < a.end;
}

function spanSortKey(
  span: DetectedSpan,
  policy: MergePolicy,
): [number, number, number] {
  const sourcePri = policy.sourcePriority[span.source] ?? 0;
  const catPri = policy.categoryPriority?.[span.category] ?? 0;
  const length = span.end - span.start;
  return [sourcePri + catPri, span.confidence, length];
}

function compareSpans(a: DetectedSpan, b: DetectedSpan, policy: MergePolicy): number {
  const ka = spanSortKey(a, policy);
  const kb = spanSortKey(b, policy);
  for (let i = 0; i < 3; i += 1) {
    if (kb[i] !== ka[i]) return kb[i] - ka[i];
  }
  return a.start - b.start;
}

/**
 * 優先度順に greedy 選択し、重複 span を除外する。
 */
export function mergeSpans(
  spans: DetectedSpan[],
  policy: MergePolicy,
): DetectedSpan[] {
  const filtered = spans.filter((s) => s.confidence >= policy.minConfidence);
  const sorted = [...filtered].sort((a, b) => compareSpans(a, b, policy));
  const selected: DetectedSpan[] = [];

  for (const candidate of sorted) {
    const overlaps = selected.some((s) => spansOverlap(s, candidate));
    if (!overlaps) {
      selected.push(candidate);
    }
  }

  return selected.sort((a, b) => a.start - b.start);
}

export function detectRegexSpans(
  text: string,
  bundle: PatternBundle,
  enabledCategories: Set<PiiCategory>,
): DetectedSpan[] {
  const spans: DetectedSpan[] = [];

  for (const [key, regexes] of Object.entries(bundle.patterns)) {
    const category = key as PiiCategory;
    if (!enabledCategories.has(category) || !regexes?.length) continue;

    for (const pattern of regexes) {
      const flags = pattern.flags.includes("u") ? pattern.flags : `${pattern.flags}u`;
      const globalFlags = flags.includes("g") ? flags : `${flags}g`;
      const re = new RegExp(pattern.source, globalFlags);

      for (const match of text.matchAll(re)) {
        const matched = match[0];
        if (!matched || match.index === undefined) continue;
        spans.push({
          start: match.index,
          end: match.index + matched.length,
          category,
          confidence: 0.95,
          source: "regex",
        });
      }
    }
  }

  return spans;
}

export function applyMaskReplacements(
  text: string,
  spans: DetectedSpan[],
  register: (original: string, category: PiiCategory) => string,
): { maskedText: string; stats: MaskStats } {
  const byCategory: Partial<Record<PiiCategory, number>> = {};
  let maskedText = text;

  const ordered = [...spans].sort((a, b) => b.start - a.start);

  for (const span of ordered) {
    const original = text.slice(span.start, span.end);
    const token = register(original, span.category);
    maskedText =
      maskedText.slice(0, span.start) + token + maskedText.slice(span.end);
    byCategory[span.category] = (byCategory[span.category] ?? 0) + 1;
  }

  const total = ordered.length;
  return { maskedText, stats: { total, byCategory } };
}

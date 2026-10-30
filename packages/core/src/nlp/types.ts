import type { DetectedSpan, PiiCategory } from "../types.js";

export interface NlpOptions {
  locale: "ja" | "en";
  minConfidence: number;
  categories?: PiiCategory[];
}

export const DEFAULT_NLP_OPTIONS: NlpOptions = {
  locale: "ja",
  minConfidence: 0.65,
};

/** 外部モデル / API が返すエンティティ（正規化前） */
export interface NlpEntity {
  text: string;
  start: number;
  end: number;
  label: string;
  confidence: number;
}

export interface NlpDetector {
  readonly id: string;
  detect(text: string, options: NlpOptions): Promise<DetectedSpan[]>;
}

export function resolveNlpCategories(
  enabled: Set<PiiCategory>,
  options: NlpOptions,
): Set<PiiCategory> {
  if (!options.categories?.length) return enabled;
  const set = new Set<PiiCategory>();
  for (const cat of options.categories) {
    if (enabled.has(cat)) set.add(cat);
  }
  return set;
}

export function mapNlpLabelToCategory(label: string): PiiCategory | null {
  const normalized = label.toUpperCase();
  if (normalized === "PER" || normalized === "PERSON" || normalized === "NAME") {
    return "name";
  }
  if (normalized === "LOC" || normalized === "LOCATION" || normalized === "ADDRESS") {
    return "address";
  }
  if (normalized === "ORG" || normalized === "ORGANIZATION") {
    return "custom";
  }
  if (normalized === "PASSWORD" || normalized === "PW") {
    return "password";
  }
  return null;
}

export function entitiesToSpans(
  entities: NlpEntity[],
  options: NlpOptions,
  enabled: Set<PiiCategory>,
): DetectedSpan[] {
  const cats = resolveNlpCategories(enabled, options);
  const spans: DetectedSpan[] = [];

  for (const entity of entities) {
    if (entity.confidence < options.minConfidence) continue;
    const category = mapNlpLabelToCategory(entity.label);
    if (!category || !cats.has(category)) continue;
    spans.push({
      start: entity.start,
      end: entity.end,
      category,
      confidence: entity.confidence,
      source: "nlp",
      meta: { nlpLabel: entity.label, detector: "mapped" },
    });
  }

  return spans;
}

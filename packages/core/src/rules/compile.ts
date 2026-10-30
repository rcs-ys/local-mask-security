import type { CompiledMaskRule, MaskRuleDefinition } from "./types.js";

const DEFAULT_GAP = "\\s*";

export function compileMaskRule(def: MaskRuleDefinition): CompiledMaskRule {
  if (!def.valuePattern) {
    throw new Error(`Rule "${def.id}" requires valuePattern`);
  }

  const valueFlags = def.valueFlags?.includes("u")
    ? def.valueFlags
    : `${def.valueFlags ?? ""}u`;

  const label =
    def.labelPattern === undefined
      ? undefined
      : new RegExp(
          def.labelPattern,
          def.labelFlags?.includes("u")
            ? def.labelFlags
            : `${def.labelFlags ?? ""}u`,
        );

  return {
    id: def.id,
    category: def.category,
    label,
    value: new RegExp(def.valuePattern, valueFlags),
    gap: new RegExp(def.gapPattern ?? DEFAULT_GAP, "u"),
    maxValueLength: def.maxValueLength,
    confidence: def.confidence,
    enabled: def.enabled !== false,
    meta: def.meta,
  };
}

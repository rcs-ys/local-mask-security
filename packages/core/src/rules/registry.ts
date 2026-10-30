import type { DetectedSpan, PiiCategory } from "../types.js";
import { compileMaskRule } from "./compile.js";
import type {
  CompiledMaskRule,
  MaskRuleBundle,
  MaskRuleDefinition,
  RuleImportMode,
} from "./types.js";

export interface RuleRegistry {
  add(definition: MaskRuleDefinition): void;
  addMany(definitions: MaskRuleDefinition[]): void;
  remove(id: string): boolean;
  importBundle(bundle: MaskRuleBundle, mode?: RuleImportMode): void;
  exportBundle(): MaskRuleBundle;
  detect(text: string, enabledCategories: Set<PiiCategory>): DetectedSpan[];
  list(): MaskRuleDefinition[];
  clear(): void;
}

export interface CreateRuleRegistryOptions {
  initialBundle?: MaskRuleBundle;
}

export function createRuleRegistry(
  options: CreateRuleRegistryOptions = {},
): RuleRegistry {
  const rules = new Map<string, CompiledMaskRule>();
  const definitions = new Map<string, MaskRuleDefinition>();

  const setRule = (def: MaskRuleDefinition) => {
    definitions.set(def.id, def);
    rules.set(def.id, compileMaskRule(def));
  };

  if (options.initialBundle) {
    for (const def of options.initialBundle.rules) {
      setRule(def);
    }
  }

  const registry: RuleRegistry = {
    add(definition: MaskRuleDefinition) {
      setRule(definition);
    },

    addMany(list: MaskRuleDefinition[]) {
      for (const def of list) registry.add(def);
    },

    remove(id: string) {
      definitions.delete(id);
      return rules.delete(id);
    },

    importBundle(bundle: MaskRuleBundle, mode: RuleImportMode = "merge") {
      if (mode === "replace") {
        rules.clear();
        definitions.clear();
      }
      for (const def of bundle.rules) {
        setRule(def);
      }
    },

    exportBundle(): MaskRuleBundle {
      return {
        version: 1,
        rules: [...definitions.values()],
      };
    },

    detect(text: string, enabledCategories: Set<PiiCategory>): DetectedSpan[] {
      const spans: DetectedSpan[] = [];

      for (const rule of rules.values()) {
        if (!rule.enabled) continue;
        if (!enabledCategories.has(rule.category)) continue;

        if (rule.label) {
          const labelFlags = rule.label.flags.includes("g")
            ? rule.label.flags
            : `${rule.label.flags}g`;
          const labelRe = new RegExp(rule.label.source, labelFlags);

          for (const labelMatch of text.matchAll(labelRe)) {
            if (labelMatch.index === undefined) continue;
            const afterLabel =
              labelMatch.index + labelMatch[0].length;
            const rest = text.slice(afterLabel);
            const gapMatch = rest.match(rule.gap ?? /\s*/u);
            const gapLen = gapMatch?.[0].length ?? 0;
            const valueSlice = rest.slice(gapLen);
            const valueMatch = valueSlice.match(rule.value);
            if (!valueMatch?.[0]) continue;

            const valueText = valueMatch[0];
            if (
              rule.maxValueLength !== undefined &&
              valueText.length > rule.maxValueLength
            ) {
              continue;
            }

            const start = afterLabel + gapLen;
            const end = start + valueText.length;
            spans.push({
              start,
              end,
              category: rule.category,
              confidence: rule.confidence,
              source: "rule",
              meta: { ruleId: rule.id, ...rule.meta },
            });
          }
        } else {
          const valueFlags = rule.value.flags.includes("g")
            ? rule.value.flags
            : `${rule.value.flags}g`;
          const valueRe = new RegExp(rule.value.source, valueFlags);
          for (const match of text.matchAll(valueRe)) {
            const matched = match[0];
            if (!matched || match.index === undefined) continue;
            if (
              rule.maxValueLength !== undefined &&
              matched.length > rule.maxValueLength
            ) {
              continue;
            }
            spans.push({
              start: match.index,
              end: match.index + matched.length,
              category: rule.category,
              confidence: rule.confidence,
              source: "rule",
              meta: { ruleId: rule.id, ...rule.meta },
            });
          }
        }
      }

      return spans;
    },

    list() {
      return [...definitions.values()];
    },

    clear() {
      rules.clear();
      definitions.clear();
    },
  };

  return registry;
}

export function parseRuleBundle(json: string): MaskRuleBundle {
  const parsed = JSON.parse(json) as MaskRuleBundle;
  if (!parsed || !Array.isArray(parsed.rules)) {
    throw new Error("Invalid MaskRuleBundle: rules array required");
  }
  return parsed;
}

export function importRulesFromJson(
  registry: RuleRegistry,
  json: string | MaskRuleBundle,
  mode: RuleImportMode = "merge",
): void {
  const bundle = typeof json === "string" ? parseRuleBundle(json) : json;
  registry.importBundle(bundle, mode);
}

/** ルール候補を学習データとして登録（将来の自動生成の入口） */
export function learnMaskRule(
  registry: RuleRegistry,
  definition: MaskRuleDefinition,
): void {
  registry.add({
    ...definition,
    meta: {
      source: "learned",
      learnedAt: new Date().toISOString(),
      ...definition.meta,
    },
  });
}

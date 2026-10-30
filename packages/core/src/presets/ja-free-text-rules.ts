import type { MaskRuleBundle, MaskRuleDefinition } from "../rules/types.js";

/** 自由文でよくある氏名の言い回し（ラベル付き帳票以外） */
export const jaFreeTextRules: MaskRuleDefinition[] = [
  {
    id: "ja-free-name-wa",
    category: "name",
    labelPattern: "(?:私(?:の|は))?(?:名前|なまえ)は",
    labelFlags: "u",
    valuePattern:
      "[\\p{Script=Han}\\p{Script=Katakana}A-Za-z・]{2,16}(?=です[。．]?|[。．]|$|\\s|と(?:申|い))",
    valueFlags: "u",
    confidence: 0.84,
  },
  {
    id: "ja-free-name-moushimasu",
    category: "name",
    valuePattern: "[\\p{Script=Han}]{2,8}(?=と申します)",
    valueFlags: "u",
    confidence: 0.82,
  },
  {
    id: "ja-free-name-mousu",
    category: "name",
    valuePattern: "[\\p{Script=Han}]{2,8}(?=と申す[。．]?|[。．]|$|\\s)",
    valueFlags: "u",
    confidence: 0.8,
  },
];

export const jaFreeTextRuleBundle: MaskRuleBundle = {
  version: 1,
  locale: "ja",
  rules: jaFreeTextRules,
};

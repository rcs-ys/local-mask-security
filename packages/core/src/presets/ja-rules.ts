import type { MaskRuleBundle } from "../rules/types.js";
import { jaFormLabelRules } from "./ja-form-labels.js";
import { jaFreeTextRules } from "./ja-free-text-rules.js";

/** 日本語フォーム等でよく使うラベル付きルール + 自由文ルール */
export const jaDefaultRuleBundle: MaskRuleBundle = {
  version: 1,
  locale: "ja",
  rules: [...jaFormLabelRules, ...jaFreeTextRules],
};

import {
  ALL_PII_CATEGORIES,
  DEFAULT_CATEGORIES,
  DEFAULT_MERGE_POLICY,
  type CreateMaskEngineOptions,
  type PiiCategory,
} from "../types.js";
import { createJaFreeTextStubNlpDetector } from "./ja-free-text-nlp.js";

const NLP_CATEGORIES: PiiCategory[] = [
  "name",
  "address",
  "password",
  "custom",
];

/**
 * 日本語自由文で定義済み PII を可能な限り検出する engine オプション。
 * 姓名辞書は `dictionary` に `createJaNamesDictionaryRegistry*` の結果を渡す（Node / fetch 読込後）。
 */
export function createJaMaxPiiEngineOptions(
  overrides: Partial<CreateMaskEngineOptions> = {},
): CreateMaskEngineOptions {
  return {
    loadDefaultJaRules: true,
    nlp: createJaFreeTextStubNlpDetector(),
    useDefaultStubNlp: false,
    mergePolicy: {
      ...DEFAULT_MERGE_POLICY,
      minConfidence: 0.5,
      ...overrides.mergePolicy,
    },
    nlpOptions: {
      minConfidence: 0.65,
      locale: "ja",
      categories: NLP_CATEGORIES,
      ...overrides.nlpOptions,
    },
    ...overrides,
    locale: overrides.locale ?? "ja",
    stages: { regex: true, dictionary: true, nlp: true, ...overrides.stages },
    categories: { ...DEFAULT_CATEGORIES, ...overrides.categories },
  };
}

/** 有効化されている PII カテゴリ一覧（ドキュメント・UI 用） */
export function listJaMaxPiiCategories(): readonly PiiCategory[] {
  return ALL_PII_CATEGORIES;
}

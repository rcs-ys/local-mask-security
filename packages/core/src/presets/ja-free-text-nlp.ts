import { createStubNlpDetector, type StubNlpDetectorOptions } from "../nlp/stub-detector.js";
import type { NlpDetector } from "../nlp/types.js";

/** 自由文向けの追加 name ヒューリスティック（stub 用） */
export const JA_FREE_TEXT_STUB_NAME_PATTERNS: NonNullable<
  StubNlpDetectorOptions["namePatterns"]
> = [
  {
    source: "[\\p{Script=Han}]{2,8}(?=と申します)",
    flags: "u",
    confidence: 0.74,
  },
  {
    source: "[\\p{Script=Han}]{2,6}(?=と申す)",
    flags: "u",
    confidence: 0.72,
  },
  {
    source: "[\\p{Script=Han}]{2,6}(?=が|を|に|と|より)(?![\\p{Script=Han}]{0,2}(?:さん|くん|ちゃん|様|氏))",
    flags: "u",
    confidence: 0.66,
  },
];

/**
 * 自由文 PII 向けに拡張した stub NLP（外部 API 不要・ブラウザ可）。
 */
export function createJaFreeTextStubNlpDetector(
  options: StubNlpDetectorOptions = {},
): NlpDetector {
  return createStubNlpDetector({
    id: "nlp-stub-free-text",
    ...options,
    namePatterns: [
      ...JA_FREE_TEXT_STUB_NAME_PATTERNS,
      ...(options.namePatterns ?? []),
    ],
  });
}

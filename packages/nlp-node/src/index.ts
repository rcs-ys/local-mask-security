import {
  createCompositeNlpDetector,
  createJaFreeTextStubNlpDetector,
  type NlpDetector,
  type StubNlpDetectorOptions,
} from "@local-mask-security/core";

/**
 * Node.js（Route Handler 等）向けの NLP 検出器。
 * 自由文拡張 stub。将来 `@huggingface/transformers` 等に差し替え可能。
 */
export function createNodeNlpDetector(
  options: StubNlpDetectorOptions = {},
): NlpDetector {
  return createJaFreeTextStubNlpDetector({
    id: "nlp-node",
    ...options,
  });
}

export function createDefaultNodeNlpStack(): NlpDetector {
  return createCompositeNlpDetector([createNodeNlpDetector()]);
}

export type { NlpDetector, StubNlpDetectorOptions };

import type { DetectedSpan } from "../types.js";
import type { NlpDetector, NlpOptions } from "./types.js";

export function createCompositeNlpDetector(
  detectors: NlpDetector[],
  id = "nlp-composite",
): NlpDetector {
  return {
    id,
    async detect(text: string, options: NlpOptions): Promise<DetectedSpan[]> {
      const batches = await Promise.all(
        detectors.map((d) => d.detect(text, options)),
      );
      return batches.flat();
    },
  };
}

export function normalizeNlpDetectors(
  nlp?: NlpDetector | NlpDetector[],
): NlpDetector[] {
  if (!nlp) return [];
  return Array.isArray(nlp) ? nlp : [nlp];
}

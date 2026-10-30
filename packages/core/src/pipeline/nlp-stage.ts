import type { PiiCategory } from "../types.js";
import type { DetectedSpan } from "../types.js";
import type { NlpDetector, NlpOptions } from "../nlp/types.js";

export async function detectNlpSpans(
  text: string,
  detectors: NlpDetector[],
  options: NlpOptions,
  enabledCategories: Set<PiiCategory>,
): Promise<DetectedSpan[]> {
  const categories = options.categories
    ? options.categories.filter((c) => enabledCategories.has(c))
    : [...enabledCategories];

  const nlpOptions: NlpOptions = {
    ...options,
    categories,
  };

  const spans: DetectedSpan[] = [];
  for (const detector of detectors) {
    const batch = await detector.detect(text, nlpOptions);
    for (const span of batch) {
      if (enabledCategories.has(span.category)) {
        spans.push(span);
      }
    }
  }
  return spans;
}

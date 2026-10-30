import { describe, expect, it } from "vitest";
import { DEFAULT_MERGE_POLICY } from "../src/types.js";
import type { DetectedSpan } from "../src/types.js";
import { mergeSpans } from "../src/pipeline/mask-pipeline.js";

describe("mergeSpans", () => {
  it("重複 span は優先度の高い方のみ残す", () => {
    const spans: DetectedSpan[] = [
      {
        start: 0,
        end: 10,
        category: "email",
        confidence: 0.95,
        source: "regex",
      },
      {
        start: 2,
        end: 8,
        category: "account_id",
        confidence: 0.99,
        source: "nlp",
      },
    ];
    const merged = mergeSpans(spans, DEFAULT_MERGE_POLICY);
    expect(merged).toHaveLength(1);
    expect(merged[0].category).toBe("email");
  });

  it("非重複 span は両方残す", () => {
    const spans: DetectedSpan[] = [
      {
        start: 0,
        end: 5,
        category: "email",
        confidence: 0.95,
        source: "regex",
      },
      {
        start: 10,
        end: 15,
        category: "phone",
        confidence: 0.95,
        source: "regex",
      },
    ];
    expect(mergeSpans(spans, DEFAULT_MERGE_POLICY)).toHaveLength(2);
  });
});

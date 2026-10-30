import { describe, expect, it, vi } from "vitest";
import { createRemoteNlpDetector } from "../src/nlp/remote-detector.js";

describe("createRemoteNlpDetector", () => {
  it("API 応答を span に変換", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entities: [
          {
            text: "佐藤",
            start: 2,
            end: 4,
            label: "PER",
            confidence: 0.91,
          },
        ],
      }),
    });

    const detector = createRemoteNlpDetector({
      url: "https://example.com/ner",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const spans = await detector.detect("来訪者佐藤", {
      locale: "ja",
      minConfidence: 0.6,
      categories: ["name"],
    });

    expect(spans).toHaveLength(1);
    expect(spans[0].category).toBe("name");
  });
});

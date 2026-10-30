import { describe, expect, it } from "vitest";
import { createStubNlpDetector } from "../src/nlp/stub-detector.js";
import { entitiesToSpans } from "../src/nlp/types.js";

describe("createStubNlpDetector", () => {
  it("「田中さん」を name として検出", async () => {
    const detector = createStubNlpDetector();
    const spans = await detector.detect("先方の田中さんが訪問しました。", {
      locale: "ja",
      minConfidence: 0.65,
      categories: ["name"],
    });
    expect(spans.some((s) => s.category === "name" && s.source === "nlp")).toBe(
      true,
    );
  });

  it("都道府県から始まる住所風文字列を address として検出", async () => {
    const detector = createStubNlpDetector();
    const spans = await detector.detect(
      "本社は東京都渋谷区神南1-2-3 にあります。",
      {
        locale: "ja",
        minConfidence: 0.65,
        categories: ["address"],
      },
    );
    expect(spans.some((s) => s.category === "address")).toBe(true);
  });

  it("都道府県なしの市区町村から始まる住所も address として検出", async () => {
    const detector = createStubNlpDetector();
    const spans = await detector.detect("配送先: 高松市錦町", {
      locale: "ja",
      minConfidence: 0.65,
      categories: ["address"],
    });
    const addr = spans.find((s) => s.category === "address");
    expect(addr).toBeDefined();
    expect("配送先: 高松市錦町".slice(addr!.start, addr!.end)).toBe("高松市錦町");
  });
});

describe("entitiesToSpans", () => {
  it("PER / LOC ラベルをカテゴリへマップ", () => {
    const spans = entitiesToSpans(
      [
        {
          text: "佐藤",
          start: 0,
          end: 2,
          label: "PER",
          confidence: 0.9,
        },
      ],
      { locale: "ja", minConfidence: 0.6 },
      new Set(["name"]),
    );
    expect(spans[0].category).toBe("name");
  });
});

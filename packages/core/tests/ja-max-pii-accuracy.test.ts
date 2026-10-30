import { describe, expect, it } from "vitest";
import { createMaskEngine } from "../src/engine.js";
import { createJaMaxPiiEngineOptions } from "../src/presets/ja-max-pii.js";
import { createDictionaryRegistry } from "../src/dictionary/registry.js";

const SAMPLE = `氏名：山田太郎
連絡先: tanaka@example.com / 090-1234-5678
メモ: 東京都の支社

私の名前は山田太郎です。
郵便番号は100-0001です。
マイナンバーは1234-1234-1234、090-1234-0987。

高松市錦町1-2-3`;

describe("ja-max-pii + 姓名辞書（精度）", () => {
  it("ラベル・自由文を壊さず主要 PII のみマスク", async () => {
    const dictionary = createDictionaryRegistry({ minNameLength: 2 });
    dictionary.add({ value: "山田", category: "name" });
    dictionary.add({ value: "太郎", category: "name" });
    dictionary.add({ value: "山田太郎", category: "name" });

    const engine = createMaskEngine({
      ...createJaMaxPiiEngineOptions(),
      dictionary,
      tokenFormat: { style: "readable", locale: "ja" },
    });

    const { maskedText } = await engine.mask(SAMPLE);

    expect(maskedText).toContain("氏名：");
    expect(maskedText).toMatch(/氏名：<氏名:\d+>/);
    expect(maskedText).not.toMatch(/氏名：<氏名[^>]+><氏名/);
    expect(maskedText).toContain("連絡先:");
    expect(maskedText).not.toContain("tanaka@example.com");
    expect(maskedText).not.toContain("1234-1234-1234");
    expect(maskedText).not.toContain("100-0001");
    expect(maskedText).not.toContain("1-2-3");
    expect(maskedText).toMatch(/<住所(:\d+)?>/);
    expect(maskedText).not.toContain("山田太郎");
    expect(engine.unmask(maskedText).unmaskedText).toBe(SAMPLE);
  });

  it("住所とマイナンバーが改行で分離されている", async () => {
    const input = `メモ: 高松市錦町

1234-5678-9012 ←マイナンバー`;

    const engine = createMaskEngine({
      ...createJaMaxPiiEngineOptions(),
      tokenFormat: { style: "readable", locale: "ja" },
    });
    const { maskedText } = await engine.mask(input);

    expect(maskedText).toMatch(/メモ: <住所(:\d+)?>/);
    expect(maskedText).toMatch(/<マイナンバー(:\d+)?>/);
    expect(maskedText).not.toMatch(/<住所[^>]*1234-5678-9012/);
    expect(maskedText).not.toContain("1234-5678-9012");
    expect(engine.unmask(maskedText).unmaskedText).toBe(input);
  });
});

import { describe, expect, it } from "vitest";
import { createMaskEngine } from "../src/engine.js";
import { createJaMaxPiiEngineOptions } from "../src/presets/ja-max-pii.js";

describe("自由文 PII（ja-max-pii）", () => {
  it("私の名前は山田太郎です。を name としてマスク", async () => {
    const engine = createMaskEngine(createJaMaxPiiEngineOptions());
    const input = "私の名前は山田太郎です。";
    const { maskedText } = await engine.mask(input);
    expect(maskedText).not.toContain("山田太郎");
    expect(engine.unmask(maskedText).unmaskedText).toBe(input);
  });

  it("regex でメール・電話をマスク", async () => {
    const engine = createMaskEngine(createJaMaxPiiEngineOptions());
    const input = "連絡先 tanaka@example.com と 090-1234-5678";
    const { maskedText } = await engine.mask(input);
    expect(maskedText).not.toContain("tanaka@example.com");
    expect(maskedText).not.toMatch(/090-1234-5678/);
  });
});

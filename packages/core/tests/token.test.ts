import { describe, expect, it } from "vitest";
import {
  deriveSessionShort,
  formatMaskToken,
  MASK_TOKEN_PATTERN,
} from "../src/token.js";
import { createMaskEngine } from "../src/engine.js";
import { createInMemoryMaskStore } from "../src/store/in-memory.js";

describe("token", () => {
  it("deriveSessionShort は UUID 先頭 8 文字（ハイフン除く）", () => {
    expect(deriveSessionShort("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(
      "a1b2c3d4",
    );
  });

  it("formatMaskToken compact 形式", () => {
    expect(formatMaskToken("a1b2c3d4", "email", 7)).toBe(
      "⟦MSK:a1b2c3d4:email:0007⟧",
    );
  });

  it("formatMaskToken readable 形式", () => {
    expect(
      formatMaskToken("x", "name", 1, { style: "readable", locale: "ja" }),
    ).toBe("<氏名>");
    expect(
      formatMaskToken("x", "phone", 2, { style: "readable", locale: "ja" }),
    ).toBe("<電話番号:2>");
  });

  it("MASK_TOKEN_PATTERN が compact / readable にマッチ", () => {
    expect("⟦MSK:deadbeef:phone:0001⟧".match(MASK_TOKEN_PATTERN)?.[0]).toBe(
      "⟦MSK:deadbeef:phone:0001⟧",
    );
    expect("<メールアドレス>".match(MASK_TOKEN_PATTERN)?.[0]).toBe(
      "<メールアドレス>",
    );
  });

  it("readable で mask / unmask 往返", async () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: "readable-session",
      tokenFormat: { style: "readable", locale: "ja" },
      stages: { regex: true, dictionary: false, nlp: false },
    });
    const input = "連絡先 a@b.co / 090-1234-5678";
    const { maskedText } = await engine.mask(input);
    expect(maskedText).toMatch(/<メールアドレス(:\d+)?>/);
    expect(maskedText).toMatch(/<電話番号(:\d+)?>/);
    expect(engine.unmask(maskedText).unmaskedText).toBe(input);
  });

  it("外部 store でも engine の tokenFormat で unmask できる", async () => {
    const store = createInMemoryMaskStore();
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: "external-store-readable",
      store,
      tokenFormat: { style: "readable", locale: "ja" },
      stages: { regex: true, dictionary: false, nlp: false },
      loadDefaultJaRules: false,
    });
    const input = "連絡先: a@b.co";
    const { maskedText } = await engine.mask(input);
    expect(maskedText).toMatch(/<メールアドレス(:\d+)?>/);
    const mockLlm = `【mock】\n${maskedText}`;
    expect(engine.unmask(mockLlm).unmaskedText).toContain("a@b.co");
  });
});

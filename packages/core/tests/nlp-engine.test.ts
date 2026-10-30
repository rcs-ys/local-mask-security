import { describe, expect, it } from "vitest";
import { createMaskEngine } from "../src/engine.js";

describe("engine NLP stage", () => {
  it("stages.nlp で stub が動作する", async () => {
    const engine = createMaskEngine({
      locale: "ja",
      stages: { regex: false, dictionary: false, nlp: true },
      categories: {
        email: false,
        phone: false,
        address: false,
        name: true,
        birthdate: false,
        my_number: false,
        account_id: false,
        password: false,
        custom: false,
      },
    });

    const input = "担当の鈴木さんへ連絡。";
    const { maskedText, stats } = await engine.mask(input);
    expect(stats.byCategory.name).toBeGreaterThanOrEqual(1);
    expect(maskedText).not.toContain("鈴木さん");
    expect(engine.unmask(maskedText).unmaskedText).toBe(input);
  });
});

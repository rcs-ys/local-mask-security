import { describe, expect, it, vi } from "vitest";
import { createMaskEngine } from "../src/engine.js";
import { createInMemoryMaskStore } from "../src/store/in-memory.js";

const FIXED_SESSION = "11111111-2222-3333-4444-555555555555";

describe("createMaskEngine", () => {
  it("メールと電話をマスクし unmask で復元できる", async () => {
    const store = createInMemoryMaskStore();
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: FIXED_SESSION,
      store,
      categories: {
        email: true,
        phone: true,
        address: false,
        name: false,
        birthdate: false,
        my_number: false,
        account_id: false,
        password: false,
        custom: false,
      },
    });

    const input =
      "連絡先は tanaka@example.com または 090-1234-5678 まで。";
    const { maskedText, stats } = await engine.mask(input);

    expect(stats.total).toBe(2);
    expect(stats.byCategory.email).toBe(1);
    expect(stats.byCategory.phone).toBe(1);
    expect(maskedText).not.toContain("tanaka@example.com");
    expect(maskedText).not.toContain("090-1234-5678");
    expect(maskedText).toContain("⟦MSK:");

    const roundtrip = engine.unmask(maskedText);
    expect(roundtrip.missingTokens).toHaveLength(0);
    expect(roundtrip.unmaskedText).toBe(input);
  });

  it("onAudit が mask / unmask で呼ばれる", async () => {
    const onAudit = vi.fn();
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: FIXED_SESSION,
      onAudit,
    });
    const { maskedText } = await engine.mask("a@b.co");
    engine.unmask(maskedText);
    expect(onAudit).toHaveBeenCalledTimes(2);
  });

  it("未知トークンは preserve 默认", () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: FIXED_SESSION,
    });
    const fake = "⟦MSK:00000000:email:9999⟧";
    const { unmaskedText, missingTokens } = engine.unmask(`hello ${fake}`);
    expect(missingTokens).toEqual([fake]);
    expect(unmaskedText).toContain(fake);
  });

  it("未知トークン throw", () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: FIXED_SESSION,
    });
    expect(() =>
      engine.unmask("⟦MSK:00000000:email:9999⟧", {
        missingTokenPolicy: "throw",
      }),
    ).toThrow(/Unknown mask token/);
  });
});

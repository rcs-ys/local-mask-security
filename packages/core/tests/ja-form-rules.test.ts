import { describe, expect, it } from "vitest";
import { createMaskEngine } from "../src/engine.js";
import { createRuleRegistry } from "../src/rules/registry.js";
import { jaFormLabelRules } from "../src/presets/ja-form-labels.js";

const SESSION = "rule-test-session-001";

describe("jaFormLabelRules", () => {
  it("氏名ルールが改行をまたがない", async () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: SESSION,
      stages: { regex: false, dictionary: true, nlp: false },
      rules: createRuleRegistry({
        initialBundle: { rules: jaFormLabelRules },
      }),
      loadDefaultJaRules: false,
      categories: {
        email: true,
        phone: true,
        address: false,
        name: true,
        birthdate: false,
        my_number: false,
        account_id: false,
        password: false,
        custom: true,
      },
    });

    const input =
      "氏名：山田太郎\n連絡先: tanaka@example.com / 090-1234-5678\nメモ: 東京都の支社";
    const { maskedText } = await engine.mask(input);

    expect(maskedText).toContain("氏名：");
    expect(maskedText).not.toContain("山田太郎");
    expect(maskedText).not.toMatch(/氏名：[^\n]*連絡先/);
    expect(maskedText).toContain("連絡先:");
  });

  it("連絡先ラベル行を処理（email / phone）", async () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: SESSION,
      stages: { regex: true, dictionary: true, nlp: false },
      loadDefaultJaRules: true,
    });

    const input = "連絡先：tanaka@example.com / 090-1234-5678";
    const { maskedText, stats } = await engine.mask(input);

    expect(maskedText).not.toContain("tanaka@example.com");
    expect(maskedText).not.toContain("090-1234-5678");
    expect(stats.total).toBeGreaterThanOrEqual(2);
  });

  it("メール・電話ラベル", async () => {
    const registry = createRuleRegistry({
      initialBundle: { rules: jaFormLabelRules },
    });
    const spans = registry.detect(
      "メールアドレス：a@b.co\n電話番号：03-1234-5678",
      new Set(["email", "phone"]),
    );
    expect(spans.filter((s) => s.category === "email")).toHaveLength(1);
    expect(spans.filter((s) => s.category === "phone")).toHaveLength(1);
  });
});

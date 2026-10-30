import { describe, expect, it } from "vitest";
import { createMaskEngine } from "../src/engine.js";

const SESSION = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("maskJson", () => {
  it("maskStringFields でネストした文字列をマスク", async () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: SESSION,
      stages: { regex: true, dictionary: false, nlp: false },
      loadDefaultJaRules: false,
      categories: {
        email: true,
        phone: false,
        address: false,
        name: false,
        birthdate: false,
        my_number: false,
        account_id: false,
        password: false,
        custom: false,
      },
    });

    const payload = {
      profile: { email: "a@example.com", note: "ok" },
      items: [{ text: "b@test.co" }],
    };

    const { value, stats } = await engine.maskJson(payload, {
      maskStringFields: ["email", "text"],
    });

    expect(stats.total).toBe(2);
    expect(value.profile.email).not.toContain("@");
    expect(value.profile.note).toBe("ok");
    expect(value.items[0].text).not.toContain("@");
  });

  it("paths で特定フィールドのみマスク", async () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: SESSION,
      stages: { regex: true, dictionary: false, nlp: false },
      loadDefaultJaRules: false,
    });

    const payload = {
      messages: [{ content: "mail x@y.co" }, { content: "plain" }],
    };

    const { value } = await engine.maskJson(payload, {
      paths: ["$.messages[*].content"],
    });

    expect(value.messages[0].content).not.toContain("@");
    expect(value.messages[1].content).toBe("plain");
  });
});

describe("Stage2 + 学習", () => {
  it("学習した辞書が次の mask に反映される", async () => {
    const engine = createMaskEngine({
      locale: "ja",
      sessionId: SESSION,
      stages: { regex: false, dictionary: true, nlp: false },
      loadDefaultJaRules: false,
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

    engine.dictionary.add({ value: "田中一郎", category: "name" });
    const { maskedText, stats } = await engine.mask("来訪者: 田中一郎");
    expect(stats.byCategory.name).toBe(1);
    expect(maskedText).not.toContain("田中一郎");
  });
});

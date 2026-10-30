import { describe, expect, it } from "vitest";
import { createRuleRegistry } from "../src/rules/registry.js";

describe("RuleRegistry", () => {
  it("ラベル付き氏名を検出", () => {
    const registry = createRuleRegistry({
      initialBundle: {
        rules: [
          {
            id: "name",
            category: "name",
            labelPattern: "氏名[:：]",
            labelFlags: "u",
            valuePattern: "[\\p{Script=Han}]{2,4}",
            valueFlags: "u",
            confidence: 0.85,
          },
        ],
      },
    });
    const spans = registry.detect("氏名：山田太郎", new Set(["name"]));
    expect(spans).toHaveLength(1);
    expect(spans[0].source).toBe("rule");
  });
});

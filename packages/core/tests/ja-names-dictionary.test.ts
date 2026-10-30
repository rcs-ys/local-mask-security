import { describe, expect, it } from "vitest";
import { parseLastNameCsv, parseGivenNameCsv } from "../../patterns-ja/src/names/parse.js";

describe("日本語姓名 CSV パーサー", () => {
  it("苗字 CSV を漢字・かな・ローマ字で登録", () => {
    const entries = parseLastNameCsv("佐藤,さとう,satou\n");
    expect(entries.map((e) => e.value).sort()).toEqual(
      ["satou", "さとう", "佐藤"].sort(),
    );
    expect(entries.every((e) => e.category === "name")).toBe(true);
  });

  it("名前 CSV は漢字バリエーションをすべて登録", () => {
    const entries = parseGivenNameCsv("あい,ai,藍,愛\n", "man");
    expect(entries.some((e) => e.value === "藍")).toBe(true);
    expect(entries.some((e) => e.value === "愛")).toBe(true);
    expect(entries.some((e) => e.value === "あい")).toBe(true);
  });

  it("createJaNamesDictionaryRegistry で佐藤を検出", async () => {
    const { createJaNamesDictionaryRegistry } = await import(
      "../src/ja-names.js"
    );
    const registry = createJaNamesDictionaryRegistry();
    const spans = registry.detect("担当者は佐藤です", new Set(["name"]));
    expect(spans.length).toBeGreaterThanOrEqual(1);
  }, 60_000);
});

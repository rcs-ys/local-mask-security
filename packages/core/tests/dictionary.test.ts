import { describe, expect, it } from "vitest";
import {
  createDictionaryRegistry,
  importDictionaryFromJson,
  learnDictionaryEntry,
} from "../src/dictionary/registry.js";

function textSlice(text: string, span: { start: number; end: number }) {
  return text.slice(span.start, span.end);
}

describe("DictionaryRegistry", () => {
  it("辞書エントリを検出する", () => {
    const registry = createDictionaryRegistry();
    registry.add({ value: "杉山太郎", category: "name" });
    const spans = registry.detect("担当は杉山太郎です", new Set(["name"]));
    expect(spans).toHaveLength(1);
    expect(spans[0].source).toBe("dictionary");
  });

  it("長い語を優先（重複しない）", () => {
    const registry = createDictionaryRegistry();
    registry.add({ value: "東京", category: "address" });
    registry.add({ value: "東京都", category: "address" });
    const spans = registry.detect("東京都渋谷区", new Set(["address"]));
    expect(spans).toHaveLength(1);
    expect(spans[0].end - spans[0].start).toBe(3);
  });

  it("1 文字 name エントリは minNameLength=2 で検出しない", () => {
    const registry = createDictionaryRegistry({ minNameLength: 2 });
    registry.add({ value: "氏", category: "name" });
    registry.add({ value: "山田", category: "name" });
    const spans = registry.detect("氏名：山田太郎", new Set(["name"]));
    expect(spans.some((s) => s.end - s.start === 1)).toBe(false);
    expect(spans.some((s) => textSlice("氏名：山田太郎", s) === "山田")).toBe(
      true,
    );
  });

  it("JSON 取り込み merge / export", () => {
    const registry = createDictionaryRegistry();
    importDictionaryFromJson(
      registry,
      JSON.stringify({
        entries: [{ value: "山田", category: "name" }],
      }),
    );
    learnDictionaryEntry(registry, "佐藤", "name");
    const bundle = registry.exportBundle();
    expect(bundle.entries.length).toBeGreaterThanOrEqual(2);
  });
});

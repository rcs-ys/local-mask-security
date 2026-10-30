import { describe, expect, it } from "vitest";
import { AhoCorasick } from "../src/dictionary/aho-corasick.js";
import { createDictionaryRegistry } from "../src/dictionary/registry.js";

describe("AhoCorasick", () => {
  it("複数パターンを一度に検出", () => {
    const ac = new AhoCorasick([
      { id: 0, text: "東京" },
      { id: 1, text: "大阪" },
    ]);
    const hits = ac.search("東京と大阪");
    expect(hits.length).toBeGreaterThanOrEqual(2);
  });
});

describe("DictionaryRegistry aho-corasick", () => {
  it("matcher: aho-corasick で辞書ヒット", () => {
    const registry = createDictionaryRegistry({ matcher: "aho-corasick" });
    registry.addMany([
      { value: "杉山", category: "name" },
      { value: "田中", category: "name" },
    ]);
    const spans = registry.detect("杉山と田中", new Set(["name"]));
    expect(spans.length).toBe(2);
    expect(spans.every((s) => s.meta?.matcher === "aho-corasick")).toBe(true);
  });
});

import type { DetectedSpan, PiiCategory } from "../types.js";
import { AhoCorasick } from "./aho-corasick.js";
import {
  defaultDictionaryMatchOptions,
  type DictionaryMatchOptions,
} from "./normalize.js";
import type {
  DictionaryBundle,
  DictionaryEntry,
  DictionaryImportMode,
} from "./types.js";

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function entryKey(value: string, normalizer: (s: string) => string): string {
  return normalizer(value);
}

export type DictionaryMatcher = "auto" | "aho-corasick" | "regex";

export interface DictionaryRegistry {
  add(entry: DictionaryEntry): void;
  addMany(entries: DictionaryEntry[]): void;
  remove(value: string): boolean;
  importBundle(bundle: DictionaryBundle, mode?: DictionaryImportMode): void;
  exportBundle(): DictionaryBundle;
  detect(text: string, enabledCategories: Set<PiiCategory>): DetectedSpan[];
  size(): number;
  clear(): void;
}

export interface CreateDictionaryRegistryOptions extends DictionaryMatchOptions {
  initialBundle?: DictionaryBundle;
  /** 默认 auto（1 件以上で Aho-Corasick） */
  matcher?: DictionaryMatcher;
  /**
   * name カテゴリの最短文字数（默认 2）。
   * 1 文字の姓名エントリが「氏名」「東京都」等を誤検知するのを抑える。
   */
  minNameLength?: number;
}

export function createDictionaryRegistry(
  options: CreateDictionaryRegistryOptions = {},
): DictionaryRegistry {
  const matchOptions = {
    ...defaultDictionaryMatchOptions(),
    ...options,
  };
  const matcher = options.matcher ?? "auto";
  const minNameLength = options.minNameLength ?? 2;

  const acceptsEntry = (entry: DictionaryEntry): boolean => {
    if (entry.category !== "name") return true;
    return entry.value.length >= minNameLength;
  };

  const entries = new Map<string, DictionaryEntry>();
  let indexedEntries: DictionaryEntry[] = [];
  let automaton: AhoCorasick | null = null;

  const toScanText = (value: string): string => {
    const normalized = matchOptions.normalizer(value);
    return matchOptions.caseInsensitive
      ? normalized.toLowerCase()
      : normalized;
  };

  const rebuildIndex = (list: DictionaryEntry[]) => {
    entries.clear();
    for (const entry of list) {
      if (!entry.value) continue;
      if (!acceptsEntry(entry)) continue;
      entries.set(entryKey(entry.value, matchOptions.normalizer), entry);
    }
    rebuildAutomaton();
  };

  const rebuildAutomaton = () => {
    indexedEntries = [...entries.values()].sort(
      (a, b) => b.value.length - a.value.length,
    );
    const patterns = indexedEntries.map((entry, id) => ({
      id,
      text: toScanText(entry.value),
    }));
    automaton =
      patterns.length > 0 ? new AhoCorasick(patterns) : null;
  };

  const useAhoCorasick = (): boolean => {
    if (matcher === "regex") return false;
    if (matcher === "aho-corasick") return true;
    return entries.size > 0;
  };

  const detectWithRegex = (
    text: string,
    enabledCategories: Set<PiiCategory>,
  ): DetectedSpan[] => {
    const spans: DetectedSpan[] = [];
    const occupied: DetectedSpan[] = [];
    const overlaps = (start: number, end: number) =>
      occupied.some((s) => start < s.end && s.start < end);

    for (const entry of indexedEntries.length
      ? indexedEntries
      : [...entries.values()].sort((a, b) => b.value.length - a.value.length)) {
      if (!enabledCategories.has(entry.category)) continue;
      if (!entry.value) continue;
      if (!acceptsEntry(entry)) continue;

      const flags = matchOptions.caseInsensitive ? "giu" : "gu";
      const pattern = escapeRegexLiteral(entry.value);
      const re = new RegExp(pattern, flags);

      for (const match of text.matchAll(re)) {
        const matched = match[0];
        if (!matched || match.index === undefined) continue;
        const start = match.index;
        const end = start + matched.length;
        if (overlaps(start, end)) continue;
        const span: DetectedSpan = {
          start,
          end,
          category: entry.category,
          confidence: entry.meta?.confidence ?? 0.9,
          source: "dictionary",
          meta: {
            dictionaryKey: entryKey(entry.value, matchOptions.normalizer),
            matcher: "regex",
            ...entry.meta,
          },
        };
        spans.push(span);
        occupied.push(span);
      }
    }
    return spans;
  };

  const detectWithAho = (
    text: string,
    enabledCategories: Set<PiiCategory>,
  ): DetectedSpan[] => {
    if (!automaton) return [];
    const haystack = matchOptions.caseInsensitive
      ? matchOptions.normalizer(text).toLowerCase()
      : matchOptions.normalizer(text);

    const raw = automaton.search(haystack);
    raw.sort((a, b) => {
      const lenA = a.end - a.start;
      const lenB = b.end - b.start;
      if (lenB !== lenA) return lenB - lenA;
      return a.start - b.start;
    });

    const spans: DetectedSpan[] = [];
    const occupied: DetectedSpan[] = [];
    const overlaps = (start: number, end: number) =>
      occupied.some((s) => start < s.end && s.start < end);

    for (const hit of raw) {
      const entry = indexedEntries[hit.id];
      if (!entry || !enabledCategories.has(entry.category)) continue;
      if (!acceptsEntry(entry)) continue;
      if (overlaps(hit.start, hit.end)) continue;

      spans.push({
        start: hit.start,
        end: hit.end,
        category: entry.category,
        confidence: entry.meta?.confidence ?? 0.9,
        source: "dictionary",
        meta: {
          dictionaryKey: entryKey(entry.value, matchOptions.normalizer),
          matcher: "aho-corasick",
          ...entry.meta,
        },
      });
      occupied.push(spans[spans.length - 1]!);
    }

    return spans;
  };

  if (options.initialBundle) {
    rebuildIndex(options.initialBundle.entries);
  }

  const registry: DictionaryRegistry = {
    add(entry: DictionaryEntry) {
      if (!acceptsEntry(entry)) return;
      entries.set(entryKey(entry.value, matchOptions.normalizer), entry);
      rebuildAutomaton();
    },

    addMany(list: DictionaryEntry[]) {
      for (const entry of list) registry.add(entry);
    },

    remove(value: string) {
      const ok = entries.delete(entryKey(value, matchOptions.normalizer));
      if (ok) rebuildAutomaton();
      return ok;
    },

    importBundle(bundle: DictionaryBundle, mode: DictionaryImportMode = "merge") {
      if (mode === "replace") {
        rebuildIndex(bundle.entries);
        return;
      }
      for (const entry of bundle.entries) {
        registry.add(entry);
      }
    },

    exportBundle(): DictionaryBundle {
      return {
        version: 1,
        entries: [...entries.values()],
      };
    },

    detect(text: string, enabledCategories: Set<PiiCategory>): DetectedSpan[] {
      if (useAhoCorasick()) {
        return detectWithAho(text, enabledCategories);
      }
      return detectWithRegex(text, enabledCategories);
    },

    size() {
      return entries.size;
    },

    clear() {
      entries.clear();
      indexedEntries = [];
      automaton = null;
    },
  };

  return registry;
}

/** 学習・フィードバックから辞書へ追加（後から取り込む入口） */
export function learnDictionaryEntry(
  registry: DictionaryRegistry,
  value: string,
  category: PiiCategory,
  meta?: DictionaryEntry["meta"],
): void {
  registry.add({
    value,
    category,
    meta: {
      source: "learned",
      learnedAt: new Date().toISOString(),
      ...meta,
    },
  });
}

export function parseDictionaryBundle(json: string): DictionaryBundle {
  const parsed = JSON.parse(json) as DictionaryBundle;
  if (!parsed || !Array.isArray(parsed.entries)) {
    throw new Error("Invalid DictionaryBundle: entries array required");
  }
  return parsed;
}

export function importDictionaryFromJson(
  registry: DictionaryRegistry,
  json: string | DictionaryBundle,
  mode: DictionaryImportMode = "merge",
): void {
  const bundle = typeof json === "string" ? parseDictionaryBundle(json) : json;
  registry.importBundle(bundle, mode);
}

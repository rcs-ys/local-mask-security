import type { PiiCategory } from "../types.js";

export interface DictionaryEntryMeta {
  source?: "manual" | "import" | "learned" | "model" | string;
  learnedAt?: string;
  confidence?: number;
  note?: string;
}

export interface DictionaryEntry {
  value: string;
  category: PiiCategory;
  meta?: DictionaryEntryMeta;
}

/** 永続化・取り込み用 JSON 形式 */
export interface DictionaryBundle {
  version?: number;
  locale?: string;
  entries: DictionaryEntry[];
}

export type DictionaryImportMode = "merge" | "replace";

import type { MaskStats, PiiCategory, MaskJsonOptions } from "../types.js";

export type { MaskJsonOptions };

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function mergeStats(a: MaskStats, b: MaskStats): MaskStats {
  const byCategory: Partial<Record<PiiCategory, number>> = { ...a.byCategory };
  for (const [cat, count] of Object.entries(b.byCategory)) {
    const key = cat as PiiCategory;
    byCategory[key] = (byCategory[key] ?? 0) + (count ?? 0);
  }
  return {
    total: a.total + b.total,
    byCategory,
  };
}

function parsePath(path: string): string[] {
  const trimmed = path.startsWith("$.") ? path.slice(2) : path.startsWith("$") ? path.slice(1) : path;
  if (trimmed.startsWith(".")) return parsePath(trimmed.slice(1));
  return trimmed.split(".").filter(Boolean);
}

function segmentIsWildcard(segment: string): boolean {
  return segment === "[*]" || segment.endsWith("[*]");
}

function segmentKey(segment: string): string {
  return segment.replace(/\[\*\]$/, "");
}

async function maskAtPath(
  value: JsonValue,
  segments: string[],
  maskString: (text: string) => Promise<{ text: string; stats: MaskStats }>,
): Promise<{ value: JsonValue; stats: MaskStats }> {
  if (segments.length === 0) {
    if (typeof value === "string") {
      return maskString(value).then((r) => ({
        value: r.text,
        stats: r.stats,
      }));
    }
    return Promise.resolve({ value, stats: { total: 0, byCategory: {} } });
  }

  const [head, ...tail] = segments;
  const key = segmentKey(head);
  const wildcard = segmentIsWildcard(head);

  if (Array.isArray(value) && wildcard) {
    return Promise.all(
      value.map((item) => maskAtPath(item, tail, maskString)),
    ).then((results) => ({
      value: results.map((r) => r.value),
      stats: results.reduce(
        (acc, r) => mergeStats(acc, r.stats),
        { total: 0, byCategory: {} } as MaskStats,
      ),
    }));
  }

  if (Array.isArray(value)) {
    const results = await Promise.all(
      value.map((item) => maskAtPath(item, segments, maskString)),
    );
    return {
      value: results.map((r) => r.value),
      stats: results.reduce(
        (acc, r) => mergeStats(acc, r.stats),
        { total: 0, byCategory: {} } as MaskStats,
      ),
    };
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, JsonValue>;
    if (!(key in record)) {
      return Promise.resolve({ value, stats: { total: 0, byCategory: {} } });
    }
    return maskAtPath(record[key], tail, maskString).then((inner) => ({
      value: { ...record, [key]: inner.value },
      stats: inner.stats,
    }));
  }

  return Promise.resolve({ value, stats: { total: 0, byCategory: {} } });
}

async function maskByFieldNames(
  value: JsonValue,
  fieldNames: Set<string>,
  maskString: (text: string) => Promise<{ text: string; stats: MaskStats }>,
): Promise<{ value: JsonValue; stats: MaskStats }> {
  if (typeof value === "string") {
    return maskString(value).then((r) => ({ value: r.text, stats: r.stats }));
  }

  if (Array.isArray(value)) {
    const results = await Promise.all(
      value.map((item) => maskByFieldNames(item, fieldNames, maskString)),
    );
    return {
      value: results.map((r) => r.value),
      stats: results.reduce(
        (acc, r) => mergeStats(acc, r.stats),
        { total: 0, byCategory: {} },
      ),
    };
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, JsonValue>;
    let stats: MaskStats = { total: 0, byCategory: {} };
    const out: Record<string, JsonValue> = {};

    for (const [key, child] of Object.entries(record)) {
      if (fieldNames.has(key) && typeof child === "string") {
        const masked = await maskString(child);
        out[key] = masked.text;
        stats = mergeStats(stats, masked.stats);
      } else {
        const nested = await maskByFieldNames(child, fieldNames, maskString);
        out[key] = nested.value;
        stats = mergeStats(stats, nested.stats);
      }
    }

    return { value: out, stats };
  }

  return { value, stats: { total: 0, byCategory: {} } };
}

export async function maskJsonValue<T>(
  value: T,
  maskString: (text: string) => Promise<{ text: string; stats: MaskStats }>,
  options: MaskJsonOptions = {},
): Promise<{ value: T; stats: MaskStats }> {
  const jsonValue = value as JsonValue;

  if (options.paths?.length) {
    let current: JsonValue = jsonValue;
    let stats: MaskStats = { total: 0, byCategory: {} };
    for (const path of options.paths) {
      const segments = parsePath(path);
      const result = await maskAtPath(current, segments, maskString);
      current = result.value;
      stats = mergeStats(stats, result.stats);
    }
    return { value: current as T, stats };
  }

  if (options.maskStringFields?.length) {
    const set = new Set(options.maskStringFields);
    const result = await maskByFieldNames(jsonValue, set, maskString);
    return { value: result.value as T, stats: result.stats };
  }

  return { value, stats: { total: 0, byCategory: {} } };
}

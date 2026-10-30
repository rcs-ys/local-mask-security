import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NameDictionaryBundle } from "./parse.js";

let cache: NameDictionaryBundle | undefined;

/** `data/ja-names.bundle.json` を読み込む（ビルド成果物に JSON を同梱しない） */
export function loadJaNamesDictionaryBundle(): NameDictionaryBundle {
  if (cache) return cache;
  const dir = dirname(fileURLToPath(import.meta.url));
  const file = join(dir, "..", "..", "data", "ja-names.bundle.json");
  cache = JSON.parse(readFileSync(file, "utf8")) as NameDictionaryBundle;
  return cache;
}

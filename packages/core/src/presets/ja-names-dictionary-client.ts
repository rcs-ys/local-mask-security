import type { DictionaryBundle } from "../dictionary/types.js";
import {
  createDictionaryRegistry,
  parseDictionaryBundle,
  type CreateDictionaryRegistryOptions,
} from "../dictionary/registry.js";

/** 既に読み込んだ bundle から姓名辞書レジストリを構築（ブラウザ fetch 後など） */
export function createJaNamesDictionaryRegistryFromBundle(
  bundle: DictionaryBundle,
  options: Omit<CreateDictionaryRegistryOptions, "initialBundle"> = {},
) {
  return createDictionaryRegistry({
    matcher: "aho-corasick",
    minNameLength: 2,
    ...options,
    initialBundle: bundle,
  });
}

/** 同一オリジン URL などから JSON を取得して姓名辞書を構築（外部 NER API ではない） */
export async function createJaNamesDictionaryRegistryFromUrl(
  url: string,
  options: Omit<CreateDictionaryRegistryOptions, "initialBundle"> = {},
) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to load name dictionary: ${res.status} ${res.statusText}`,
    );
  }
  const text = await res.text();
  const bundle = parseDictionaryBundle(text);
  return createJaNamesDictionaryRegistryFromBundle(bundle, options);
}

import { loadJaNamesDictionaryBundle } from "@local-mask-security/patterns-ja/names";
import type { CreateDictionaryRegistryOptions } from "../dictionary/registry.js";
import { createJaNamesDictionaryRegistryFromBundle } from "./ja-names-dictionary-client.js";

/**
 * docs/data/*.csv から生成した日本語姓名辞書（約 9.6 万エントリ）。
 * Node / Route Handler 専用（`node:fs`）。ブラウザでは `ja-names/client` を利用。
 */
export function createJaNamesDictionaryRegistry(
  options: Omit<CreateDictionaryRegistryOptions, "initialBundle"> = {},
) {
  return createJaNamesDictionaryRegistryFromBundle(
    loadJaNamesDictionaryBundle(),
    options,
  );
}

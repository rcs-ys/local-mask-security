export type TextNormalizer = (text: string) => string;

export const normalizeNfkc: TextNormalizer = (text) => text.normalize("NFKC");

export interface DictionaryMatchOptions {
  caseInsensitive?: boolean;
  normalizer?: TextNormalizer;
}

export function defaultDictionaryMatchOptions(): Required<DictionaryMatchOptions> {
  return {
    caseInsensitive: true,
    normalizer: normalizeNfkc,
  };
}

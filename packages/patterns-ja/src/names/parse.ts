/** patterns-ja 側の型（core と同形） */
export interface NameDictionaryEntry {
  value: string;
  category: "name";
  meta?: {
    source?: string;
    note?: string;
  };
}

export interface NameDictionaryBundle {
  version: number;
  locale: string;
  entries: NameDictionaryEntry[];
}

function pushUnique(
  set: Set<string>,
  entries: NameDictionaryEntry[],
  value: string,
  note: string,
): void {
  const trimmed = value.trim();
  if (!trimmed || set.has(trimmed)) return;
  set.add(trimmed);
  entries.push({
    value: trimmed,
    category: "name",
    meta: { source: "import", note },
  });
}

/** 苗字 CSV: 漢字, ひらがな, ローマ字 */
export function parseLastNameCsv(content: string): NameDictionaryEntry[] {
  const seen = new Set<string>();
  const entries: NameDictionaryEntry[] = [];

  for (const line of content.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    const parts = row.split(",");
    if (parts.length < 3) continue;
    const [kanji, hiragana, romaji] = parts;
    pushUnique(seen, entries, kanji, "last_name:kanji");
    pushUnique(seen, entries, hiragana, "last_name:hiragana");
    pushUnique(seen, entries, romaji, "last_name:romaji");
  }

  return entries;
}

/** 名前 CSV（男・女）: ひらがな, ローマ字, 漢字… */
export function parseGivenNameCsv(
  content: string,
  notePrefix: "man" | "woman",
): NameDictionaryEntry[] {
  const seen = new Set<string>();
  const entries: NameDictionaryEntry[] = [];

  for (const line of content.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    const parts = row.split(",");
    if (parts.length < 3) continue;
    const hiragana = parts[0]!;
    const romaji = parts[1]!;
    const kanjiVariants = parts.slice(2);

    pushUnique(seen, entries, hiragana, `${notePrefix}:hiragana`);
    pushUnique(seen, entries, romaji, `${notePrefix}:romaji`);
    for (const kanji of kanjiVariants) {
      pushUnique(seen, entries, kanji, `${notePrefix}:kanji`);
    }
  }

  return entries;
}

export function buildJapaneseNameDictionaryBundle(sources: {
  lastNameCsv: string;
  manCsv: string;
  womanCsv: string;
}): NameDictionaryBundle {
  const entries = [
    ...parseLastNameCsv(sources.lastNameCsv),
    ...parseGivenNameCsv(sources.manCsv, "man"),
    ...parseGivenNameCsv(sources.womanCsv, "woman"),
  ];

  return {
    version: 1,
    locale: "ja",
    entries,
  };
}

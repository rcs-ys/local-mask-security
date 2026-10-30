import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(root, "docs", "data");
const outPath = path.join(
  root,
  "packages",
  "patterns-ja",
  "data",
  "ja-names.bundle.json",
);

function pushUnique(set, entries, value, note) {
  const trimmed = value.trim();
  if (!trimmed || set.has(trimmed)) return;
  if (trimmed.length < 2) return;
  if (/^[a-zA-Z]+$/.test(trimmed) && trimmed.length < 4) return;
  set.add(trimmed);
  entries.push({
    value: trimmed,
    category: "name",
    meta: { source: "import", note },
  });
}

function parseLastNameCsv(content) {
  const seen = new Set();
  const entries = [];
  for (const line of content.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    const parts = row.split(",");
    if (parts.length < 3) continue;
    pushUnique(seen, entries, parts[0], "last_name:kanji");
    pushUnique(seen, entries, parts[1], "last_name:hiragana");
    pushUnique(seen, entries, parts[2], "last_name:romaji");
  }
  return entries;
}

function parseGivenNameCsv(content, notePrefix) {
  const seen = new Set();
  const entries = [];
  for (const line of content.split(/\r?\n/)) {
    const row = line.trim();
    if (!row) continue;
    const parts = row.split(",");
    if (parts.length < 3) continue;
    pushUnique(seen, entries, parts[0], `${notePrefix}:hiragana`);
    pushUnique(seen, entries, parts[1], `${notePrefix}:romaji`);
    for (const kanji of parts.slice(2)) {
      pushUnique(seen, entries, kanji, `${notePrefix}:kanji`);
    }
  }
  return entries;
}

const lastNameCsv = fs.readFileSync(
  path.join(dataDir, "last_name.csv"),
  "utf8",
);
const manCsv = fs.readFileSync(path.join(dataDir, "man.csv"), "utf8");
const womanCsv = fs.readFileSync(path.join(dataDir, "woman.csv"), "utf8");

const entries = [
  ...parseLastNameCsv(lastNameCsv),
  ...parseGivenNameCsv(manCsv, "man"),
  ...parseGivenNameCsv(womanCsv, "woman"),
];

const bundle = {
  version: 1,
  locale: "ja",
  entries,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(bundle), "utf8");

console.log(
  `Wrote ${entries.length} name entries to ${path.relative(root, outPath)}`,
);

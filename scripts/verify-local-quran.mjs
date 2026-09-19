import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const corpusPath = path.join(root, "public/quran/mushaf-hafs.json");
const raw = await readFile(corpusPath, "utf8");
const rows = JSON.parse(raw);

if (!Array.isArray(rows)) throw new Error("Quran corpus must be a JSON array.");
if (rows.length !== 6236) throw new Error(`Expected 6236 ayahs, found ${rows.length}`);

const keys = new Set();
const surahs = new Set();
const pages = new Set();

for (const row of rows) {
  if (!Number.isInteger(row.surah_id) || row.surah_id < 1 || row.surah_id > 114) {
    throw new Error(`Invalid surah_id: ${row.surah_id}`);
  }
  if (!Number.isInteger(row.ayah_number) || row.ayah_number < 1) {
    throw new Error(`Invalid ayah_number: ${row.ayah_number}`);
  }
  if (typeof row.text_uthmani !== "string" || !row.text_uthmani.trim()) {
    throw new Error(`Missing Uthmani text at ${row.surah_id}:${row.ayah_number}`);
  }
  const key = `${row.surah_id}:${row.ayah_number}`;
  if (keys.has(key)) throw new Error(`Duplicate Quran ayah: ${key}`);
  keys.add(key);
  surahs.add(row.surah_id);
  if (Number.isInteger(row.page)) pages.add(row.page);
}

if (surahs.size !== 114) throw new Error(`Expected 114 surahs, found ${surahs.size}`);
if (keys.size !== 6236) throw new Error(`Expected 6236 unique ayahs, found ${keys.size}`);
if (Math.min(...pages) !== 1 || Math.max(...pages) !== 604 || pages.size !== 604) {
  throw new Error("Mushaf page mapping must cover exactly pages 1..604.");
}

const ordered = [...rows].sort((a, b) => a.surah_id - b.surah_id || a.ayah_number - b.ayah_number);
if (ordered[0]?.surah_id !== 1 || ordered[0]?.ayah_number !== 1) {
  throw new Error("Corpus does not begin at Surah 1:1.");
}
const last = ordered.at(-1);
if (last?.surah_id !== 114 || last?.ayah_number !== 6) {
  throw new Error("Corpus does not end at Surah 114:6.");
}

console.log(JSON.stringify({
  corpus: "Tanzil Uthmani snapshot",
  edition: "Hafs / Uthmani",
  surahs: surahs.size,
  ayahs: keys.size,
  pages: pages.size,
  first: `${ordered[0].surah_id}:${ordered[0].ayah_number}`,
  last: `${last.surah_id}:${last.ayah_number}`,
}, null, 2));

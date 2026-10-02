import { readFile } from "node:fs/promises";
import path from "node:path";
import { getVersePuzzleAyah, getVersePuzzleRules } from "@/lib/games/verse-puzzle";

const corpusPath = path.join(process.cwd(), "public/quran/mushaf-hafs.json");
const raw = await readFile(corpusPath, "utf8");
const rows = JSON.parse(raw);

if (!Array.isArray(rows) || rows.length !== 6236) {
  throw new Error("Verse Puzzle requires the canonical 6236-ayah Quran corpus.");
}

const ayahByKey = new Map<string, string>();

for (const row of rows) {
  if (
    !Number.isInteger(row?.surah_id) ||
    !Number.isInteger(row?.ayah_number) ||
    typeof row?.text_uthmani !== "string" ||
    !row.text_uthmani.trim()
  ) {
    throw new Error("Quran corpus contains an invalid ayah row.");
  }

  const key = `${row.surah_id}:${row.ayah_number}`;
  if (ayahByKey.has(key)) throw new Error(`Duplicate Quran ayah: ${key}`);
  ayahByKey.set(key, row.text_uthmani.trim());
}

const cases = [
  { difficulty: "easy" as const, ayah: 1 },
  { difficulty: "normal" as const, ayah: 2 },
  { difficulty: "hard" as const, ayah: 2 },
];

for (const item of cases) {
  const rules = getVersePuzzleRules(item.difficulty);
  if (getVersePuzzleAyah(item.difficulty, 0) !== item.ayah) {
    throw new Error(`Verse difficulty mapping mismatch for ${item.difficulty}.`);
  }

  const text = ayahByKey.get(`1:${item.ayah}`);
  if (!text) {
    throw new Error(`Verified Quran text is unavailable for Al-Fatihah ${item.ayah}.`);
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    throw new Error(`Verse Puzzle source is too short for ${item.difficulty}.`);
  }

  if (item.difficulty === "easy" && (!rules.allowHint || rules.mistakePenalty !== 0)) {
    throw new Error("Easy Verse Puzzle rules are invalid.");
  }

  if (item.difficulty === "normal" && (!rules.tolerateMistakes || rules.resetOnMistake)) {
    throw new Error("Normal Verse Puzzle rules are invalid.");
  }

  if (item.difficulty === "hard" && (!rules.resetOnMistake || rules.tolerateMistakes)) {
    throw new Error("Hard Verse Puzzle rules are invalid.");
  }
}

console.log("ZIKR Verse Puzzle check passed: canonical Quran source + differentiated difficulty rules.");

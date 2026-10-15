import { readFile } from "node:fs/promises";
import path from "node:path";
import { getVersePuzzleReference, getVersePuzzleRules } from "@/lib/games/verse-puzzle";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

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

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const rules = getVersePuzzleRules(difficulty);
  const references = Array.from({ length: KIDS_LEVEL_COUNT }, (_, levelIndex) =>
    getVersePuzzleReference(difficulty, levelIndex),
  );
  const keys = references.map(reference => `${reference.surah}:${reference.ayah}`);

  if (new Set(keys).size !== KIDS_LEVEL_COUNT) {
    throw new Error(`Verse level references must be unique for ${difficulty}.`);
  }

  for (const reference of references) {
    const key = `${reference.surah}:${reference.ayah}`;
    const text = ayahByKey.get(key);
    if (!text) {
      throw new Error(`Verified Quran text is unavailable for ${difficulty} level reference ${key}.`);
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      throw new Error(`Verse Puzzle source is too short for ${difficulty} at ${key}.`);
    }
  }

  if (difficulty === "easy" && (!rules.allowHint || rules.mistakePenalty !== 0)) {
    throw new Error("Easy Verse Puzzle rules are invalid.");
  }

  if (difficulty === "normal" && (!rules.tolerateMistakes || rules.resetOnMistake)) {
    throw new Error("Normal Verse Puzzle rules are invalid.");
  }

  if (difficulty === "hard" && (!rules.resetOnMistake || rules.tolerateMistakes)) {
    throw new Error("Hard Verse Puzzle rules are invalid.");
  }
}

console.log("ZIKR Verse Puzzle check passed: canonical Quran source + differentiated difficulty rules.");

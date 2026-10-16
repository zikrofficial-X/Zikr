import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT, getKidsLevelMeta } from "@/lib/games/kids-level-system";

export type VersePuzzleRules = {
  levelCount: number;
  allowHint: boolean;
  tolerateMistakes: boolean;
  resetOnMistake: boolean;
  mistakePenalty: number;
};

const RULES: Record<GameDifficulty, VersePuzzleRules> = {
  easy: { levelCount: KIDS_LEVEL_COUNT, allowHint: true, tolerateMistakes: true, resetOnMistake: false, mistakePenalty: 0 },
  normal: { levelCount: KIDS_LEVEL_COUNT, allowHint: false, tolerateMistakes: true, resetOnMistake: false, mistakePenalty: 35 },
  hard: { levelCount: KIDS_LEVEL_COUNT, allowHint: false, tolerateMistakes: false, resetOnMistake: true, mistakePenalty: 70 },
};

export function getVersePuzzleRules(difficulty: GameDifficulty): VersePuzzleRules { return RULES[difficulty]; }

const VERIFIED_VERSE_REFERENCES = [
  { surah: 1, ayah: 1 },
  { surah: 1, ayah: 2 },
  { surah: 1, ayah: 3 },
  { surah: 1, ayah: 4 },
  { surah: 1, ayah: 5 },
  { surah: 1, ayah: 6 },
  { surah: 1, ayah: 7 },
  { surah: 112, ayah: 1 },
  { surah: 112, ayah: 2 },
  { surah: 112, ayah: 3 },
  { surah: 112, ayah: 4 },
  { surah: 113, ayah: 1 },
  { surah: 113, ayah: 2 },
  { surah: 113, ayah: 3 },
  { surah: 113, ayah: 4 },
  { surah: 113, ayah: 5 },
  { surah: 114, ayah: 1 },
  { surah: 114, ayah: 2 },
  { surah: 114, ayah: 3 },
  { surah: 114, ayah: 4 },
] as const;

export type VersePuzzleReference = (typeof VERIFIED_VERSE_REFERENCES)[number];

/** Returns a deterministic, verified Quran reference for each level. */
export function getVersePuzzleReference(
  difficulty: GameDifficulty,
  levelIndex = 0,
): VersePuzzleReference {
  const safeLevelIndex = Number.isInteger(levelIndex)
    ? Math.max(0, Math.min(KIDS_LEVEL_COUNT - 1, levelIndex))
    : 0;
  const difficultyOffset = difficulty === "easy" ? 0 : difficulty === "normal" ? 7 : 13;
  return VERIFIED_VERSE_REFERENCES[
    (difficultyOffset + safeLevelIndex) % VERIFIED_VERSE_REFERENCES.length
  ];
}

/** Backwards-compatible helper for callers that only need an ayah number. */
export function getVersePuzzleAyah(difficulty: GameDifficulty, levelIndex = 0): number {
  return getVersePuzzleReference(difficulty, levelIndex).ayah;
}

export function getVersePuzzleLevelSeed(difficulty: GameDifficulty, levelIndex: number) {
  return getKidsLevelMeta("verse-puzzle", difficulty, levelIndex).seed;
}

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
export function getVersePuzzleAyah(difficulty: GameDifficulty, levelIndex = 0): number {
  return 1 + (levelIndex % 2);
}
export function getVersePuzzleLevelSeed(difficulty: GameDifficulty, levelIndex: number) {
  return getKidsLevelMeta("verse-puzzle", difficulty, levelIndex).seed;
}

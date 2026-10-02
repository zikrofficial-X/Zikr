import type { GameDifficulty } from "@/lib/games/registry";

export type VersePuzzleRules = {
  level: 1 | 2 | 3;
  allowHint: boolean;
  tolerateMistakes: boolean;
  resetOnMistake: boolean;
  mistakePenalty: number;
};

const RULES: Record<GameDifficulty, VersePuzzleRules> = {
  easy: {
    level: 1,
    allowHint: true,
    tolerateMistakes: false,
    resetOnMistake: false,
    mistakePenalty: 0,
  },
  normal: {
    level: 2,
    allowHint: false,
    tolerateMistakes: true,
    resetOnMistake: false,
    mistakePenalty: 35,
  },
  hard: {
    level: 3,
    allowHint: false,
    tolerateMistakes: false,
    resetOnMistake: true,
    mistakePenalty: 70,
  },
};

export function getVersePuzzleRules(difficulty: GameDifficulty): VersePuzzleRules {
  return RULES[difficulty];
}

export function getVersePuzzleAyah(difficulty: GameDifficulty): number {
  return difficulty === "easy" ? 1 : 2;
}

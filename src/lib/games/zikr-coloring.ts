import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

export type ZikrColoringRules = { levelCount: number; regionTarget: number; completionBonus: number };

const COLORING_SCENE_START_OFFSET: Record<GameDifficulty, number> = {
  easy: 0,
  normal: 2,
  hard: 4,
};

export function getZikrColoringSheetIndex(
  difficulty: GameDifficulty,
  levelIndex: number,
  sceneCount: number,
): number {
  const safeCount = Math.max(1, Math.floor(Number.isFinite(sceneCount) ? sceneCount : 1));
  const safeLevel = Math.max(0, Math.floor(Number.isFinite(levelIndex) ? levelIndex : 0));
  return (safeLevel + COLORING_SCENE_START_OFFSET[difficulty]) % safeCount;
}

export function getZikrColoringRules(difficulty: GameDifficulty, levelIndex = 0): ZikrColoringRules {
  const base = difficulty === "easy" ? 6 : difficulty === "normal" ? 8 : 9;
  return {
    levelCount: KIDS_LEVEL_COUNT,
    regionTarget: Math.min(10, base + (levelIndex % 2)),
    completionBonus: difficulty === "hard" ? 700 : difficulty === "normal" ? 500 : 350,
  };
}

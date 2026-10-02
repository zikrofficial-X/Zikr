import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

export type ZikrColoringRules = { levelCount: number; regionTarget: number; completionBonus: number };
export function getZikrColoringRules(difficulty: GameDifficulty, levelIndex = 0): ZikrColoringRules {
  const base = difficulty === "easy" ? 6 : difficulty === "normal" ? 8 : 10;
  return {
    levelCount: KIDS_LEVEL_COUNT,
    regionTarget: Math.min(12, base + (levelIndex % 3)),
    completionBonus: difficulty === "hard" ? 650 : difficulty === "normal" ? 500 : 350,
  };
}

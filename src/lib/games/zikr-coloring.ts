import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

export type ZikrColoringRules = { levelCount: number; regionTarget: number; completionBonus: number };

export function getZikrColoringRules(difficulty: GameDifficulty, levelIndex = 0): ZikrColoringRules {
  const base = difficulty === "easy" ? 6 : difficulty === "normal" ? 8 : 9;
  return {
    levelCount: KIDS_LEVEL_COUNT,
    regionTarget: Math.min(10, base + (levelIndex % 2)),
    completionBonus: difficulty === "hard" ? 700 : difficulty === "normal" ? 500 : 350,
  };
}

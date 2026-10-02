import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

export type GoodDeedsRules = { levelCount: number; sceneCount: number; rewardPerScene: number; completionBonus: number };
export function getGoodDeedsRules(difficulty: GameDifficulty, levelIndex = 0): GoodDeedsRules {
  const base = difficulty === "easy" ? 3 : difficulty === "normal" ? 4 : 5;
  return {
    levelCount: KIDS_LEVEL_COUNT,
    sceneCount: base + (levelIndex % 3),
    rewardPerScene: difficulty === "hard" ? 250 : 220,
    completionBonus: difficulty === "hard" ? 1000 : difficulty === "normal" ? 800 : 650,
  };
}

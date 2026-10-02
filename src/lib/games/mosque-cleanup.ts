import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

export type MosqueCleanupRules = { levelCount: number; itemCount: number; mistakePenalty: number; completionBonus: number };
export function getMosqueCleanupRules(difficulty: GameDifficulty, levelIndex = 0): MosqueCleanupRules {
  const base = difficulty === "easy" ? 5 : difficulty === "normal" ? 8 : 10;
  return {
    levelCount: KIDS_LEVEL_COUNT,
    itemCount: Math.min(16, base + (levelIndex % 4)),
    mistakePenalty: difficulty === "hard" ? 35 : difficulty === "normal" ? 25 : 15,
    completionBonus: difficulty === "hard" ? 950 : difficulty === "normal" ? 700 : 550,
  };
}

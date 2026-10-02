import type { GameDifficulty } from "@/lib/games/registry";

export type MosqueCleanupRules = {
  itemCount: number;
  mistakePenalty: number;
  completionBonus: number;
};

const RULES: Record<GameDifficulty, MosqueCleanupRules> = {
  easy: { itemCount: 5, mistakePenalty: 15, completionBonus: 500 },
  normal: { itemCount: 8, mistakePenalty: 25, completionBonus: 650 },
  hard: { itemCount: 10, mistakePenalty: 35, completionBonus: 850 },
};

export function getMosqueCleanupRules(difficulty: GameDifficulty): MosqueCleanupRules {
  return RULES[difficulty];
}

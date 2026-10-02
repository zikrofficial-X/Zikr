import type { GameDifficulty } from "@/lib/games/registry";

export type ZikrColoringRules = {
  regionTarget: number;
  completionBonus: number;
};

const RULES: Record<GameDifficulty, ZikrColoringRules> = {
  easy: { regionTarget: 6, completionBonus: 250 },
  normal: { regionTarget: 8, completionBonus: 350 },
  hard: { regionTarget: 10, completionBonus: 500 },
};

export function getZikrColoringRules(difficulty: GameDifficulty): ZikrColoringRules {
  return RULES[difficulty];
}

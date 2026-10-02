import type { GameDifficulty } from "@/lib/games/registry";

export type GoodDeedsRules = {
  sceneCount: number;
  rewardPerScene: number;
  completionBonus: number;
};

const RULES: Record<GameDifficulty, GoodDeedsRules> = {
  easy: { sceneCount: 3, rewardPerScene: 220, completionBonus: 500 },
  normal: { sceneCount: 5, rewardPerScene: 220, completionBonus: 700 },
  hard: { sceneCount: 6, rewardPerScene: 230, completionBonus: 900 },
};

export function getGoodDeedsRules(difficulty: GameDifficulty): GoodDeedsRules {
  return RULES[difficulty];
}

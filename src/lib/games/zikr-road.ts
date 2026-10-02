import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

export type ZikrRoadRules = {
  levelCount: number;
  goalDistance: number;
  speed: number;
  hazardInterval: number;
  starInterval: number;
  checkpointDistances: number[];
  mistakePenalty: number;
};

const RULES: Record<GameDifficulty, ZikrRoadRules> = {
  easy: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 20000, speed: 170, hazardInterval: 600, starInterval: 340, checkpointDistances: [4000, 10000, 16000], mistakePenalty: 0 },
  normal: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 22000, speed: 205, hazardInterval: 500, starInterval: 300, checkpointDistances: [3800, 8200, 12600, 17000], mistakePenalty: 35 },
  hard: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 24000, speed: 240, hazardInterval: 410, starInterval: 260, checkpointDistances: [3400, 7400, 11400, 15600, 19800], mistakePenalty: 65 },
};

export function getZikrRoadRules(difficulty: GameDifficulty): ZikrRoadRules {
  return RULES[difficulty];
}

export function getZikrRoadLevel(distance: number, goalDistance: number): number {
  if (goalDistance <= 0) return 1;
  const progress = Math.max(0, Math.min(0.999999, distance / goalDistance));
  return Math.min(KIDS_LEVEL_COUNT, 1 + Math.floor(progress * KIDS_LEVEL_COUNT));
}

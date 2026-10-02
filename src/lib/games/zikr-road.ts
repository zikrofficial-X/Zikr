import type { GameDifficulty } from "@/lib/games/registry";

export type ZikrRoadRules = {
  level: 1 | 2 | 3;
  goalDistance: number;
  speed: number;
  hazardInterval: number;
  starInterval: number;
  checkpointDistances: number[];
  mistakePenalty: number;
};

const RULES: Record<GameDifficulty, ZikrRoadRules> = {
  easy: {
    level: 1,
    goalDistance: 2400,
    speed: 180,
    hazardInterval: 520,
    starInterval: 330,
    checkpointDistances: [800],
    mistakePenalty: 0,
  },
  normal: {
    level: 2,
    goalDistance: 3600,
    speed: 220,
    hazardInterval: 430,
    starInterval: 300,
    checkpointDistances: [900, 2400],
    mistakePenalty: 40,
  },
  hard: {
    level: 3,
    goalDistance: 4800,
    speed: 260,
    hazardInterval: 350,
    starInterval: 270,
    checkpointDistances: [800, 2200, 3600],
    mistakePenalty: 70,
  },
};

export function getZikrRoadRules(difficulty: GameDifficulty): ZikrRoadRules {
  return RULES[difficulty];
}

export function getZikrRoadLevel(distance: number, goalDistance: number): number {
  if (goalDistance <= 0) return 1;
  const progress = Math.max(0, Math.min(1, distance / goalDistance));
  return Math.min(3, 1 + Math.floor(progress * 3));
}

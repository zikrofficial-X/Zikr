import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT, getKidsLevelMeta } from "@/lib/games/kids-level-system";

export type RunnerRules = {
  levelCount: number;
  goalDistance: number;
  speed: number;
  jumpVelocity: number;
  gravity: number;
  obstacleInterval: number;
  starInterval: number;
  checkpointDistances: number[];
  lives: number;
  obstaclePenalty: number;
  starReward: number;
  levelBonus: number;
  completionBonus: number;
};

const RULES: Record<GameDifficulty, RunnerRules> = {
  easy: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 18000, speed: 175, jumpVelocity: 590, gravity: 1450, obstacleInterval: 570, starInterval: 285, checkpointDistances: [3600, 9600, 15400], lives: 5, obstaclePenalty: 30, starReward: 85, levelBonus: 260, completionBonus: 900 },
  normal: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 21000, speed: 205, jumpVelocity: 610, gravity: 1500, obstacleInterval: 490, starInterval: 250, checkpointDistances: [3500, 8200, 12400, 17000], lives: 4, obstaclePenalty: 55, starReward: 100, levelBonus: 340, completionBonus: 1100 },
  hard: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 24000, speed: 235, jumpVelocity: 630, gravity: 1560, obstacleInterval: 410, starInterval: 220, checkpointDistances: [3200, 7200, 11200, 15600, 19800], lives: 3, obstaclePenalty: 85, starReward: 115, levelBonus: 450, completionBonus: 1400 },
};

export type RunnerLevel = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  theme: "garden" | "market" | "mosque" | "stars" | "dawn" | "gold";
  speedMultiplier: number;
  hazardMultiplier: number;
  starOffset: number;
};

const THEMES: RunnerLevel["theme"][] = ["garden","market","mosque","stars","dawn","gold"];

export const RUNNER_LEVELS: RunnerLevel[] = Array.from({ length: KIDS_LEVEL_COUNT }, (_, index) => {
  const meta = getKidsLevelMeta("zikr-runner", "normal", index);
  return {
    id: meta.id,
    titleAr: meta.titleAr,
    subtitleAr: meta.subtitleAr,
    theme: THEMES[index % THEMES.length],
    speedMultiplier: 0.94 + (index % 6) * 0.025,
    hazardMultiplier: 0.82 + (index % 7) * 0.07,
    starOffset: (index % 5) * 44,
  };
});

export function getZikrRunnerRules(difficulty: GameDifficulty): RunnerRules {
  return RULES[difficulty];
}

export function getZikrRunnerLevels(difficulty: GameDifficulty): RunnerLevel[] {
  return RUNNER_LEVELS.map((level, index) => ({
    ...level,
    id: level.id.replace(":normal:", ":" + difficulty + ":"),
    speedMultiplier: level.speedMultiplier + (difficulty === "normal" ? 0 : difficulty === "hard" ? 0.07 : -0.04),
    hazardMultiplier: level.hazardMultiplier + (difficulty === "hard" ? 0.12 : difficulty === "easy" ? -0.10 : 0),
    starOffset: level.starOffset + (difficulty === "hard" ? 20 : difficulty === "easy" ? -12 : 0) + index * 2,
  }));
}

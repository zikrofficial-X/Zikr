import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT, getKidsLevelMeta } from "@/lib/games/kids-level-system";

export type HilalFlyLevel = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  theme: string;
  backgroundA: string;
  backgroundB: string;
  accent: string;
  obstacleStyle: "cloud" | "gate" | "lantern" | "arch" | "crystal" | "gold";
  gapScale: number;
};
export type HilalFlyRules = {
  levelCount: number;
  goalDistance: number;
  speed: number;
  gravity: number;
  liftVelocity: number;
  maxVerticalSpeed: number;
  spawnInterval: number;
  starInterval: number;
  gapHeight: number;
  lives: number;
  collisionPenalty: number;
  starReward: number;
  levelBonus: number;
  completionBonus: number;
};

const RULES: Record<GameDifficulty, HilalFlyRules> = {
  easy: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 20000, speed: 165, gravity: 365, liftVelocity: 415, maxVerticalSpeed: 295, spawnInterval: 820, starInterval: 450, gapHeight: 205, lives: 5, collisionPenalty: 35, starReward: 85, levelBonus: 250, completionBonus: 900 },
  normal: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 22000, speed: 195, gravity: 420, liftVelocity: 465, maxVerticalSpeed: 330, spawnInterval: 710, starInterval: 380, gapHeight: 172, lives: 4, collisionPenalty: 65, starReward: 100, levelBonus: 350, completionBonus: 1100 },
  hard: { levelCount: KIDS_LEVEL_COUNT, goalDistance: 24000, speed: 230, gravity: 465, liftVelocity: 515, maxVerticalSpeed: 370, spawnInterval: 610, starInterval: 320, gapHeight: 142, lives: 3, collisionPenalty: 100, starReward: 120, levelBonus: 450, completionBonus: 1400 },
};

const COLORS = [
  ["#132844","#071725","#f3c969"],["#17405a","#071b2b","#8ab6e2"],["#3c2444","#101526","#d7a7e8"],
  ["#16433f","#071e24","#5fd1a6"],["#1f2d60","#090f25","#8ab6e2"],["#5a3a33","#171b27","#f3c969"],
];

const STYLES: HilalFlyLevel["obstacleStyle"][] = ["cloud","gate","lantern","arch","crystal","gold"];

const cache = new Map<GameDifficulty, HilalFlyLevel[]>();
export function getHilalFlyRules(difficulty: GameDifficulty): HilalFlyRules { return RULES[difficulty]; }
export function getHilalFlyLevels(difficulty: GameDifficulty): HilalFlyLevel[] {
  const cached = cache.get(difficulty);
  if (cached) return cached;
  const levels = Array.from({ length: KIDS_LEVEL_COUNT }, (_, index) => {
    const meta = getKidsLevelMeta("hilal-fly", difficulty, index);
    const c = COLORS[index % COLORS.length];
    return {
      id: meta.id,
      titleAr: meta.titleAr,
      subtitleAr: meta.subtitleAr,
      theme: "stage-" + String(index % 8),
      backgroundA: c[0],
      backgroundB: c[1],
      accent: c[2],
      obstacleStyle: STYLES[index % STYLES.length],
      gapScale: 0.92 - (index % 6) * 0.03 + (difficulty === "easy" ? 0.12 : difficulty === "hard" ? -0.05 : 0),
    };
  });
  cache.set(difficulty, levels);
  return levels;
}
export const HILAL_FLY_LEVELS = getHilalFlyLevels("normal");

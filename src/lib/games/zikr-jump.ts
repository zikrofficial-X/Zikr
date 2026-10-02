import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT, getKidsLevelMeta } from "@/lib/games/kids-level-system";

export type JumpPlatform = { x: number; y: number; width: number };
export type JumpStar = { x: number; y: number };
export type JumpHazard = { platformIndex: number; offset: number };
export type ZikrJumpLevel = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  theme: "dawn" | "garden" | "courtyard" | "sky" | "moon" | "gold";
  platforms: JumpPlatform[];
  stars: JumpStar[];
  hazards: JumpHazard[];
  goalPlatformIndex: number;
};
export type ZikrJumpRules = {
  levelCount: number;
  lives: number;
  gravity: number;
  jumpVelocity: number;
  horizontalSpeed: number;
  maxFallDistance: number;
  levelBonus: number;
  starReward: number;
  completionBonus: number;
  hazardPenalty: number;
};

const RULES: Record<GameDifficulty, ZikrJumpRules> = {
  easy: { levelCount: KIDS_LEVEL_COUNT, lives: 5, gravity: 1450, jumpVelocity: 860, horizontalSpeed: 245, maxFallDistance: 2600, levelBonus: 260, starReward: 90, completionBonus: 900, hazardPenalty: 45 },
  normal: { levelCount: KIDS_LEVEL_COUNT, lives: 4, gravity: 1525, jumpVelocity: 900, horizontalSpeed: 275, maxFallDistance: 2600, levelBonus: 380, starReward: 105, completionBonus: 1100, hazardPenalty: 80 },
  hard: { levelCount: KIDS_LEVEL_COUNT, lives: 3, gravity: 1600, jumpVelocity: 940, horizontalSpeed: 300, maxFallDistance: 2600, levelBonus: 500, starReward: 125, completionBonus: 1400, hazardPenalty: 115 },
};

const THEMES: ZikrJumpLevel["theme"][] = ["dawn","garden","courtyard","sky","moon","gold"];

function buildLevel(index: number, difficulty: GameDifficulty): ZikrJumpLevel {
  const meta = getKidsLevelMeta("zikr-jump", difficulty, index);
  const count = 9 + (index % 4);
  const gap = 190 + (index % 5) * 12 + (difficulty === "hard" ? 14 : difficulty === "easy" ? -10 : 0);
  const platforms: JumpPlatform[] = [];
  for (let i = 0; i < count; i++) {
    const wave = Math.sin((index + 1) * 0.63 + i * 1.14);
    const zig = ((index * 47 + i * 83) % 150) - 75;
    platforms.push({
      x: Math.max(125, Math.min(635, 380 + wave * 215 + zig * 0.35)),
      y: 2180 - i * gap,
      width: i === 0
        ? 240
        : Math.max(150, 230 - ((index + i) % 5) * 14 - (difficulty === "hard" ? 12 : difficulty === "easy" ? -8 : 0)),
    });
  }
  const stars = platforms.slice(1, -1).filter((_, i) => ((i + meta.pattern) % 2 === 0)).map((platform, i) => ({
    x: platform.x + (i % 2 === 0 ? -25 : 25),
    y: platform.y - 58,
  }));
  const hazardCount = difficulty === "easy" ? Math.max(0, Math.floor(index / 7)) : difficulty === "normal" ? 1 + Math.floor(index / 5) : 2 + Math.floor(index / 4);
  const hazards = Array.from({ length: Math.min(hazardCount, Math.max(0, count - 2)) }, (_, i) => ({
    platformIndex: 2 + ((i * 3 + index) % Math.max(1, count - 3)),
    offset: ((i + index) % 2 === 0 ? 1 : -1) * (18 + ((index + i) % 4) * 12),
  }));
  return {
    id: meta.id,
    titleAr: meta.titleAr,
    subtitleAr: meta.subtitleAr,
    theme: THEMES[index % THEMES.length],
    platforms,
    stars,
    hazards,
    goalPlatformIndex: platforms.length - 1,
  };
}

const cache = new Map<GameDifficulty, ZikrJumpLevel[]>();
export function getZikrJumpRules(difficulty: GameDifficulty): ZikrJumpRules { return RULES[difficulty]; }
export function getZikrJumpLevels(difficulty: GameDifficulty): ZikrJumpLevel[] {
  const cached = cache.get(difficulty);
  if (cached) return cached;
  const levels = Array.from({ length: KIDS_LEVEL_COUNT }, (_, index) => buildLevel(index, difficulty));
  cache.set(difficulty, levels);
  return levels;
}
export const ZIKR_JUMP_LEVELS = getZikrJumpLevels("normal");

import type { GameDifficulty } from "@/lib/games/registry";

export type JumpPlatform = {
  x: number;
  y: number;
  width: number;
};

export type JumpStar = {
  x: number;
  y: number;
};

export type JumpHazard = {
  platformIndex: number;
  offset: number;
};

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
  easy: {
    levelCount: 3,
    lives: 4,
    gravity: 1450,
    jumpVelocity: 860,
    horizontalSpeed: 250,
    maxFallDistance: 2600,
    levelBonus: 300,
    starReward: 100,
    completionBonus: 700,
    hazardPenalty: 60,
  },
  normal: {
    levelCount: 5,
    lives: 3,
    gravity: 1525,
    jumpVelocity: 900,
    horizontalSpeed: 275,
    maxFallDistance: 2600,
    levelBonus: 400,
    starReward: 110,
    completionBonus: 900,
    hazardPenalty: 90,
  },
  hard: {
    levelCount: 6,
    lives: 3,
    gravity: 1600,
    jumpVelocity: 940,
    horizontalSpeed: 300,
    maxFallDistance: 2600,
    levelBonus: 500,
    starReward: 125,
    completionBonus: 1200,
    hazardPenalty: 120,
  },
};

const LEVEL_THEMES: Array<Pick<ZikrJumpLevel, "id" | "titleAr" | "subtitleAr" | "theme">> = [
  { id: "first-step", titleAr: "أول خطوة", subtitleAr: "تعلّم القفزة الأولى بثبات.", theme: "dawn" },
  { id: "green-garden", titleAr: "حديقة النجوم", subtitleAr: "اجمع النجوم بين المنصات الخضراء.", theme: "garden" },
  { id: "quiet-courtyard", titleAr: "الساحة الهادئة", subtitleAr: "غيّر اتجاهك بهدوء عند كل منصة.", theme: "courtyard" },
  { id: "open-sky", titleAr: "سماء واسعة", subtitleAr: "المسافات أطول، والتوقيت أهم.", theme: "sky" },
  { id: "moon-route", titleAr: "طريق الهلال", subtitleAr: "اصعد حتى تقترب من بوابة النور.", theme: "moon" },
  { id: "golden-finale", titleAr: "الخاتمة الذهبية", subtitleAr: "آخر تحدٍ قبل نهاية الرحلة.", theme: "gold" },
];

const X_PATTERNS = [
  [330, 255, 465, 285, 470, 275, 470, 300, 450, 325],
  [330, 465, 300, 455, 255, 430, 290, 460, 320, 450],
  [330, 260, 430, 520, 400, 250, 430, 540, 330, 500],
  [330, 470, 270, 500, 330, 560, 300, 535, 375, 555],
  [330, 250, 500, 290, 520, 220, 470, 260, 520, 300],
  [330, 520, 280, 500, 240, 530, 310, 560, 275, 480],
] as const;

function buildLevel(index: number): ZikrJumpLevel {
  const meta = LEVEL_THEMES[index];
  const xs = X_PATTERNS[index];
  const topY = 2080;
  const gap = 212;

  const platforms = xs.map((x, platformIndex) => ({
    x,
    y: topY - platformIndex * gap,
    width:
      platformIndex === 0 || platformIndex === xs.length - 1
        ? 230
        : 200 - Math.min(30, Math.max(0, index - 1) * 5),
  }));

  const stars = platforms
    .slice(1, -1)
    .filter((_, platformIndex) => platformIndex % 2 === 0 || index >= 3)
    .map((platform, starIndex) => ({
      x: platform.x + (starIndex % 2 === 0 ? -30 : 30),
      y: platform.y - 58,
    }));

  const hazards: JumpHazard[] = [
    { platformIndex: 2, offset: 26 },
    { platformIndex: 5, offset: -30 },
    { platformIndex: 7, offset: 35 },
  ].slice(0, Math.min(3, 1 + Math.floor(index / 2)));

  return {
    ...meta,
    platforms,
    stars,
    hazards,
    goalPlatformIndex: platforms.length - 1,
  };
}

export const ZIKR_JUMP_LEVELS: ZikrJumpLevel[] = LEVEL_THEMES.map((_, index) =>
  buildLevel(index)
);

export function getZikrJumpRules(difficulty: GameDifficulty): ZikrJumpRules {
  return RULES[difficulty];
}

export function getZikrJumpLevels(difficulty: GameDifficulty): ZikrJumpLevel[] {
  const levels = ZIKR_JUMP_LEVELS.slice(0, RULES[difficulty].levelCount);
  if (difficulty === "easy") {
    return levels.map(level => ({ ...level, hazards: [] }));
  }
  return levels;
}

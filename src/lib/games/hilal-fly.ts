import type { GameDifficulty } from "@/lib/games/registry";

export type HilalFlyLevel = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  theme: "moon-garden" | "silver-sky" | "lantern-night" | "quiet-city" | "star-route" | "golden-dawn";
  backgroundA: string;
  backgroundB: string;
  accent: string;
  obstacleStyle: "cloud" | "gate" | "lantern" | "arch" | "crystal" | "gold";
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

const LEVELS: HilalFlyLevel[] = [
  {
    id: "moon-garden",
    titleAr: "حديقة القمر",
    subtitleAr: "ابدأ برحلة هادئة بين نجوم الليل.",
    theme: "moon-garden",
    backgroundA: "#132844",
    backgroundB: "#071725",
    accent: "#f3c969",
    obstacleStyle: "cloud",
  },
  {
    id: "silver-sky",
    titleAr: "سماء فضية",
    subtitleAr: "ارفع الهلال قليلًا ثم عد للممر المفتوح.",
    theme: "silver-sky",
    backgroundA: "#17405a",
    backgroundB: "#071b2b",
    accent: "#8ab6e2",
    obstacleStyle: "gate",
  },
  {
    id: "lantern-night",
    titleAr: "ليل الفوانيس",
    subtitleAr: "مر بين الحواجز المضيئة واجمع النجوم.",
    theme: "lantern-night",
    backgroundA: "#3c2444",
    backgroundB: "#101526",
    accent: "#d7a7e8",
    obstacleStyle: "lantern",
  },
  {
    id: "quiet-city",
    titleAr: "المدينة الهادئة",
    subtitleAr: "الممر أضيق قليلًا، فحافظ على هدوء الحركة.",
    theme: "quiet-city",
    backgroundA: "#16433f",
    backgroundB: "#071e24",
    accent: "#5fd1a6",
    obstacleStyle: "arch",
  },
  {
    id: "star-route",
    titleAr: "طريق النجوم",
    subtitleAr: "واصل الصعود والهبوط بخفة في الممر السماوي.",
    theme: "star-route",
    backgroundA: "#1f2d60",
    backgroundB: "#090f25",
    accent: "#8ab6e2",
    obstacleStyle: "crystal",
  },
  {
    id: "golden-dawn",
    titleAr: "الفجر الذهبي",
    subtitleAr: "آخر مرحلة: اجمع ما تستطيع ووصل للنهاية.",
    theme: "golden-dawn",
    backgroundA: "#5a3a33",
    backgroundB: "#171b27",
    accent: "#f3c969",
    obstacleStyle: "gold",
  },
];

const RULES: Record<GameDifficulty, HilalFlyRules> = {
  easy: {
    levelCount: 3,
    goalDistance: 3000,
    speed: 170,
    gravity: 380,
    liftVelocity: 420,
    maxVerticalSpeed: 300,
    spawnInterval: 760,
    starInterval: 430,
    gapHeight: 190,
    lives: 4,
    collisionPenalty: 40,
    starReward: 90,
    levelBonus: 250,
    completionBonus: 700,
  },
  normal: {
    levelCount: 5,
    goalDistance: 5000,
    speed: 210,
    gravity: 430,
    liftVelocity: 470,
    maxVerticalSpeed: 340,
    spawnInterval: 650,
    starInterval: 360,
    gapHeight: 155,
    lives: 3,
    collisionPenalty: 75,
    starReward: 100,
    levelBonus: 350,
    completionBonus: 900,
  },
  hard: {
    levelCount: 6,
    goalDistance: 6500,
    speed: 245,
    gravity: 470,
    liftVelocity: 520,
    maxVerticalSpeed: 380,
    spawnInterval: 560,
    starInterval: 310,
    gapHeight: 130,
    lives: 3,
    collisionPenalty: 110,
    starReward: 120,
    levelBonus: 450,
    completionBonus: 1200,
  },
};

export const HILAL_FLY_LEVELS = LEVELS;

const DIFFICULTY_LEVELS: Record<GameDifficulty, HilalFlyLevel[]> = {
  easy: LEVELS.slice(0, RULES.easy.levelCount),
  normal: LEVELS.slice(0, RULES.normal.levelCount),
  hard: LEVELS.slice(0, RULES.hard.levelCount),
};

export function getHilalFlyRules(difficulty: GameDifficulty): HilalFlyRules {
  return RULES[difficulty];
}

export function getHilalFlyLevels(difficulty: GameDifficulty): HilalFlyLevel[] {
  return DIFFICULTY_LEVELS[difficulty];
}

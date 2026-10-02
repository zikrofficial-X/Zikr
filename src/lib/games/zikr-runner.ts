import type { GameDifficulty } from "@/lib/games/registry";

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
  easy: {
    levelCount: 3,
    goalDistance: 1800,
    speed: 185,
    jumpVelocity: 590,
    gravity: 1450,
    obstacleInterval: 520,
    starInterval: 260,
    checkpointDistances: [900],
    lives: 4,
    obstaclePenalty: 35,
    starReward: 90,
    levelBonus: 260,
    completionBonus: 700,
  },
  normal: {
    levelCount: 5,
    goalDistance: 3000,
    speed: 220,
    jumpVelocity: 610,
    gravity: 1500,
    obstacleInterval: 430,
    starInterval: 230,
    checkpointDistances: [750, 1900],
    lives: 3,
    obstaclePenalty: 65,
    starReward: 105,
    levelBonus: 340,
    completionBonus: 900,
  },
  hard: {
    levelCount: 6,
    goalDistance: 4200,
    speed: 255,
    jumpVelocity: 635,
    gravity: 1560,
    obstacleInterval: 350,
    starInterval: 205,
    checkpointDistances: [700, 1700, 2850],
    lives: 3,
    obstaclePenalty: 95,
    starReward: 120,
    levelBonus: 450,
    completionBonus: 1200,
  },
};

export type RunnerLevel = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  theme: "garden" | "market" | "mosque" | "stars" | "dawn" | "gold";
};

export const RUNNER_LEVELS: RunnerLevel[] = [
  { id: "dhikr-garden", titleAr: "حديقة الذكر", subtitleAr: "تعلّم الإيقاع واجمع أول نجوم الرحلة.", theme: "garden" },
  { id: "honesty-market", titleAr: "سوق الأمانة", subtitleAr: "مر بين العربات واترك مساحة للهدوء.", theme: "market" },
  { id: "mosque-path", titleAr: "طريق المسجد", subtitleAr: "اقترب من البوابة الذهبية بثبات.", theme: "mosque" },
  { id: "star-valley", titleAr: "وادي النجوم", subtitleAr: "الممر أسرع، فراقب القفزات.", theme: "stars" },
  { id: "moon-dawn", titleAr: "الفجر الهادئ", subtitleAr: "حافظ على السلسلة حتى آخر بوابة.", theme: "dawn" },
  { id: "golden-gate", titleAr: "البوابة الذهبية", subtitleAr: "التحدي الأخير قبل إتمام الرحلة.", theme: "gold" },
];

const LEVELS_BY_DIFFICULTY: Record<GameDifficulty, RunnerLevel[]> = {
  easy: RUNNER_LEVELS.slice(0, RULES.easy.levelCount),
  normal: RUNNER_LEVELS.slice(0, RULES.normal.levelCount),
  hard: RUNNER_LEVELS.slice(0, RULES.hard.levelCount),
};

export function getZikrRunnerRules(difficulty: GameDifficulty): RunnerRules {
  return RULES[difficulty];
}

export function getZikrRunnerLevels(difficulty: GameDifficulty): RunnerLevel[] {
  return LEVELS_BY_DIFFICULTY[difficulty];
}

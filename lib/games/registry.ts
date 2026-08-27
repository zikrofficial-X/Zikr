export const GAME_REGISTRY = {
  "zikr-runner": {
    id: "zikr-runner",
    titleAr: "ذِكر رانر",
    titleEn: "ZIKR Runner",
    descriptionAr: "اجمع النجوم وتجاوز العوائق في رحلة تعليمية آمنة.",
    descriptionEn: "Collect stars and avoid obstacles in a gentle learning journey.",
    icon: "✦",
    category: "حركة ومغامرة",
    runtimeKind: "runner",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal", "hard"] as const,
    maxScore: 100_000,
    maxCollectibles: 10_000,
    maxDistance: 1_000_000,
  },
  "zikr-memory": {
    id: "zikr-memory",
    titleAr: "ذاكرة ذِكر",
    titleEn: "ZIKR Memory",
    descriptionAr: "طابق البطاقات وتعلم من المواقف اليومية.",
    descriptionEn: "Match themed cards and learn from daily situations.",
    icon: "◆",
    category: "ذاكرة وتركيز",
    runtimeKind: "memory",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["3-5", "6-8", "9-12"] as const,
    difficulties: ["easy", "normal", "hard"] as const,
    maxScore: 50_000,
    maxCollectibles: 500,
    maxDistance: 0,
  },
  "wudu-challenge": {
    id: "wudu-challenge",
    titleAr: "تحدي الوضوء",
    titleEn: "Wudu Challenge",
    descriptionAr: "رتب خطوات الوضوء من المحتوى التعليمي المعتمد.",
    descriptionEn: "Arrange wudu steps from approved educational content.",
    icon: "◌",
    category: "تعلم إسلامي",
    runtimeKind: "ordering",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal"] as const,
    maxScore: 20_000,
    maxCollectibles: 100,
    maxDistance: 0,
  },
  "verse-puzzle": {
    id: "verse-puzzle",
    titleAr: "لغز الآية",
    titleEn: "Verse Puzzle",
    descriptionAr: "رتب كلمات من نص قرآني موثق دون تغيير النص.",
    descriptionEn: "Arrange words from verified Quran text without altering it.",
    icon: "۝",
    category: "القرآن",
    runtimeKind: "verse",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["9-12"] as const,
    difficulties: ["easy", "normal", "hard"] as const,
    maxScore: 30_000,
    maxCollectibles: 100,
    maxDistance: 0,
  },
  "zikr-quiz": {
    id: "zikr-quiz",
    titleAr: "اختبار ذِكر",
    titleEn: "ZIKR Quiz",
    descriptionAr: "أسئلة قصيرة من المحتوى التعليمي الموثق.",
    descriptionEn: "Short questions from verified educational content.",
    icon: "?",
    category: "أسئلة وتعلم",
    runtimeKind: "quiz",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal", "hard"] as const,
    maxScore: 30_000,
    maxCollectibles: 100,
    maxDistance: 0,
  },
  "mosque-adventure": {
    id: "mosque-adventure",
    titleAr: "مغامرة المسجد",
    titleEn: "Mosque Adventure",
    descriptionAr: "استكشف خريطة خيالية واجمع أهداف التعلم بأمان.",
    descriptionEn: "Explore a fictional map and complete safe learning objectives.",
    icon: "⌂",
    category: "حركة ومغامرة",
    runtimeKind: "adventure",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal"] as const,
    maxScore: 50_000,
    maxCollectibles: 500,
    maxDistance: 100_000,
  },
  "zikr-road": {
    id: "zikr-road",
    titleAr: "طريق ذِكر",
    titleEn: "ZIKR Road",
    descriptionAr: "تجنب العوائق وتوقف عند أسئلة التعلم القصيرة.",
    descriptionEn: "Avoid hazards and pause for short learning questions.",
    icon: "➜",
    category: "حركة ومغامرة",
    runtimeKind: "road",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal", "hard"] as const,
    maxScore: 100_000,
    maxCollectibles: 10_000,
    maxDistance: 1_000_000,
  },
  "zikr-jump": {
    id: "zikr-jump",
    titleAr: "قفزة ذِكر",
    titleEn: "ZIKR Jump",
    descriptionAr: "اقفز بين المنصات واجمع نجوم التعلم.",
    descriptionEn: "Jump between platforms and collect learning stars.",
    icon: "↑",
    category: "حركة ومغامرة",
    runtimeKind: "jump",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal", "hard"] as const,
    maxScore: 100_000,
    maxCollectibles: 10_000,
    maxDistance: 100_000,
  },
  "good-deeds": {
    id: "good-deeds",
    titleAr: "أعمال الخير",
    titleEn: "Good Deeds",
    descriptionAr: "اختر مهمة تعليمية اختيارية داخل عالم اللعبة.",
    descriptionEn: "Choose an optional educational task inside the game world.",
    icon: "♥",
    category: "قيم وتعاون",
    runtimeKind: "good-deeds",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["3-5", "6-8", "9-12"] as const,
    difficulties: ["easy", "normal"] as const,
    maxScore: 10_000,
    maxCollectibles: 100,
    maxDistance: 0,
  },
  "hilal-fly": {
    id: "hilal-fly",
    titleAr: "طيران الهلال",
    titleEn: "Hilal Fly",
    descriptionAr: "حرك الهلال اللطيف بين العوائق واجمع النجوم.",
    descriptionEn: "Guide a friendly crescent between obstacles and collect stars.",
    icon: "☾",
    category: "أركيد هادئ",
    runtimeKind: "fly",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal", "hard"] as const,
    maxScore: 100_000,
    maxCollectibles: 10_000,
    maxDistance: 1_000_000,
  },
  "mosque-cleanup": {
    id: "mosque-cleanup",
    titleAr: "ترتيب المكان",
    titleEn: "Mosque Cleanup",
    descriptionAr: "رتب بيئة خيالية نظيفة ومحترمة باللمس أو السحب.",
    descriptionEn: "Sort a clean fictional environment by tapping or dragging.",
    icon: "✧",
    category: "قيم وتعاون",
    runtimeKind: "cleanup",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    difficulties: ["easy", "normal"] as const,
    maxScore: 20_000,
    maxCollectibles: 100,
    maxDistance: 0,
  },
  "zikr-coloring": {
    id: "zikr-coloring",
    titleAr: "تلوين ذِكر",
    titleEn: "ZIKR Coloring",
    descriptionAr: "لون رسومات أصلية واحفظها على جهازك دون حساب.",
    descriptionEn: "Color original illustrations and save them locally without an account.",
    icon: "●",
    category: "إبداع",
    runtimeKind: "coloring",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["3-5", "6-8", "9-12"] as const,
    difficulties: ["easy", "normal"] as const,
    maxScore: 10_000,
    maxCollectibles: 100,
    maxDistance: 0,
  },
} as const;

export type GameId = keyof typeof GAME_REGISTRY;
export type GameDefinition = (typeof GAME_REGISTRY)[GameId];
export type GameRuntimeKind = GameDefinition["runtimeKind"];
export type GameDifficulty = "easy" | "normal" | "hard";
export type GameAgeGroup = "3-5" | "6-8" | "9-12" | "13-15";

export type GameContentMetadata = {
  gameId: GameId;
  version?: number;
  difficulty?: GameDifficulty;
};

export type GameResultPayload = {
  gameId: string;
  score: number;
  collectibles: number;
  distance: number;
  difficulty?: string;
  level?: number;
  combo?: number;
  timeSeconds?: number;
  completed?: boolean;
  clientSubmissionId?: string;
  metadata?: Record<string, unknown>;
};

export type GameResult = {
  id: string;
  gameId: GameId;
  score: number;
  collectibles: number;
  distance: number;
  xpAwarded: number;
  difficulty: GameDifficulty;
  playedAt: string;
  queued?: boolean;
};

export type OfflineQueuedResult = GameResultPayload & {
  clientSubmissionId: string;
  queuedAt: number;
  attempts: number;
  nextAttemptAt: number;
};

export function isRegisteredGameId(value: unknown): value is GameId {
  return typeof value === "string" && value in GAME_REGISTRY;
}

export function getGameDefinition(value: unknown): GameDefinition | null {
  return isRegisteredGameId(value) ? GAME_REGISTRY[value] : null;
}

export function normalizeDifficulty(value: unknown): GameDifficulty {
  return value === "normal" || value === "hard" ? value : "easy";
}

export function parseGameContentMetadata(value: unknown): GameContentMetadata | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (!isRegisteredGameId(candidate.gameId)) return null;

  return {
    gameId: candidate.gameId,
    version: typeof candidate.version === "number" ? candidate.version : undefined,
    difficulty: normalizeDifficulty(candidate.difficulty),
  };
}

export function calculateBoundedXp(result: Pick<GameResultPayload, "score" | "collectibles" | "distance" | "completed">) {
  const scoreXp = Math.floor(Math.max(0, result.score) / 250);
  const collectibleXp = Math.min(20, Math.floor(Math.max(0, result.collectibles) / 5));
  const distanceXp = Math.floor(Math.max(0, result.distance) / 2_000);
  const completionXp = result.completed ? 10 : 0;
  return Math.max(0, Math.min(100, scoreXp + collectibleXp + distanceXp + completionXp));
}

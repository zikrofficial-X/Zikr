export const GAME_REGISTRY = {
  "zikr-runner": {
    id: "zikr-runner",
    titleAr: "ذِكر رانر",
    titleEn: "ZIKR Runner",
    descriptionAr: "اجمع النجوم وتجاوز العوائق في رحلة تعليمية آمنة.",
    version: 1,
    defaultDifficulty: "easy",
    supportedAgeGroups: ["6-8", "9-12"] as const,
    maxScore: 100_000,
    maxCollectibles: 10_000,
    maxDistance: 1_000_000,
  },
} as const;

export type GameId = keyof typeof GAME_REGISTRY;
export type GameDefinition = (typeof GAME_REGISTRY)[GameId];
export type GameDifficulty = "easy" | "normal" | "hard";

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

export function calculateBoundedXp(result: Pick<GameResultPayload, "score" | "collectibles" | "distance">) {
  const scoreXp = Math.floor(result.score / 250);
  const collectibleXp = Math.min(20, Math.floor(result.collectibles / 5));
  const distanceXp = Math.floor(result.distance / 2_000);
  return Math.max(0, Math.min(100, scoreXp + collectibleXp + distanceXp));
}

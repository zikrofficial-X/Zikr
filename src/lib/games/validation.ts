import {
  getGameDefinition,
  normalizeDifficulty,
  type GameDifficulty,
  type GameResultPayload,
} from "@/lib/games/registry";

const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;
const MAX_LEVEL = 100;
const MAX_COMBO = 10_000;
const MAX_TIME_SECONDS = 86_400;
const MAX_METADATA_BYTES = 4_096;
const MAX_METADATA_DEPTH = 4;
const MAX_METADATA_KEYS = 32;
const MAX_METADATA_ARRAY_LENGTH = 50;
const MAX_METADATA_STRING_LENGTH = 512;
const ALLOWED_METADATA_KEYS = new Set([
  "source", "runtime", "dailyMissionId", "dailyMissionCompleted",
  "roundTimeSeconds", "mistakes", "accuracy",
]);

function isSafeJsonValue(value: unknown, depth = 0): boolean {
  if (depth > MAX_METADATA_DEPTH) return false;
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "string") return value.length <= MAX_METADATA_STRING_LENGTH;
  if (typeof value === "number") return Number.isFinite(value) && Math.abs(value) <= 1_000_000_000;
  if (Array.isArray(value)) {
    return value.length <= MAX_METADATA_ARRAY_LENGTH && value.every(item => isSafeJsonValue(item, depth + 1));
  }
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= MAX_METADATA_KEYS && entries.every(([key, item]) =>
    ALLOWED_METADATA_KEYS.has(key) && isSafeJsonValue(item, depth + 1)
  );
}

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
  if (value === undefined) return {};
  if (!isRecord(value) || !isSafeJsonValue(value)) return null;
  try {
    const serialized = JSON.stringify(value);
    if (typeof serialized !== "string" || new TextEncoder().encode(serialized).byteLength > MAX_METADATA_BYTES) return null;
    return JSON.parse(serialized) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type ValidatedGameResultPayload = {
  gameId: GameResultPayload["gameId"];
  score: number;
  collectibles: number;
  distance: number;
  difficulty: GameDifficulty;
  level: number;
  combo: number;
  timeSeconds: number;
  completed: boolean;
  clientSubmissionId: string;
  metadata: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function boundedInteger(value: unknown, max: number, fallback = 0) {
  if (!finiteInteger(value)) return fallback;
  return Math.min(max, value);
}

export function validateGameResultPayload(body: unknown): ValidatedGameResultPayload | null {
  if (!isRecord(body)) return null;

  const definition = getGameDefinition(body.gameId);
  if (!definition) return null;
  if (!finiteInteger(body.score) || body.score > definition.maxScore) return null;
  if (!finiteInteger(body.collectibles) || body.collectibles > definition.maxCollectibles) return null;
  if (!finiteInteger(body.distance) || body.distance > definition.maxDistance) return null;

  const clientSubmissionId = typeof body.clientSubmissionId === "string" ? body.clientSubmissionId : "";
  if (!CLIENT_ID_PATTERN.test(clientSubmissionId)) return null;
  const metadata = normalizeMetadata(body.metadata);
  if (!metadata) return null;

  return {
    gameId: definition.id,
    score: body.score,
    collectibles: body.collectibles,
    distance: body.distance,
    difficulty: normalizeDifficulty(body.difficulty),
    level: boundedInteger(body.level, MAX_LEVEL),
    combo: boundedInteger(body.combo, MAX_COMBO),
    timeSeconds: boundedInteger(body.timeSeconds, MAX_TIME_SECONDS),
    completed: body.completed === true,
    clientSubmissionId,
    metadata,
  };
}

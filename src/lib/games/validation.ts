// @ts-nocheck - Game implementation with Phaser physics engine
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
    metadata: isRecord(body.metadata) ? body.metadata : {},
  };
}

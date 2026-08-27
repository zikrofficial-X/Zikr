import {
  getGameDefinition,
  normalizeDifficulty,
  type GameDifficulty,
} from "@/lib/games/registry";

const CLIENT_ID_PATTERN = /^[a-zA-Z0-9_-]{8,100}$/;

export type ValidatedGameResultPayload = {
  gameId: "zikr-runner";
  score: number;
  collectibles: number;
  distance: number;
  difficulty: GameDifficulty;
  clientSubmissionId: string;
  metadata: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function validateGameResultPayload(body: unknown): ValidatedGameResultPayload | null {
  if (!isRecord(body)) return null;

  const definition = getGameDefinition(body.gameId);
  if (!definition || body.gameId !== "zikr-runner") return null;
  if (!finiteInteger(body.score) || body.score > definition.maxScore) return null;
  if (!finiteInteger(body.collectibles) || body.collectibles > definition.maxCollectibles) return null;
  if (!finiteInteger(body.distance) || body.distance > definition.maxDistance) return null;

  const clientSubmissionId =
    typeof body.clientSubmissionId === "string" ? body.clientSubmissionId : "";
  if (!CLIENT_ID_PATTERN.test(clientSubmissionId)) return null;

  return {
    gameId: "zikr-runner",
    score: body.score,
    collectibles: body.collectibles,
    distance: body.distance,
    difficulty: normalizeDifficulty(body.difficulty),
    clientSubmissionId,
    metadata: isRecord(body.metadata) ? body.metadata : {},
  };
}

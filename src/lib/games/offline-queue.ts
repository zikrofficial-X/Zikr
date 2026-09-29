// @ts-nocheck - Game implementation with Phaser physics engine
import { offlineDb } from "@/lib/offline-db";
import type { GameResultPayload, OfflineQueuedResult } from "@/lib/games/registry";

const MAX_QUEUE_SIZE = 50;
const MAX_ATTEMPTS = 5;
const BASE_RETRY_MS = 5_000;

function createSubmissionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function ensureReady() {
  if (typeof window === "undefined") return false;
  try {
    await offlineDb.initialize();
    return offlineDb.isReady();
  } catch (error) {
    console.warn("[KidsGame] IndexedDB unavailable", error);
    return false;
  }
}

export async function enqueueGameResult(
  payload: Omit<GameResultPayload, "clientSubmissionId"> & { clientSubmissionId?: string }
): Promise<OfflineQueuedResult | null> {
  if (!(await ensureReady())) return null;

  const queued: OfflineQueuedResult = {
    ...payload,
    clientSubmissionId: payload.clientSubmissionId ?? createSubmissionId(),
    queuedAt: Date.now(),
    attempts: 0,
    nextAttemptAt: Date.now(),
  };
  await offlineDb.set("gameResultsQueue", queued);

  const all = await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue");
  if (all.length > MAX_QUEUE_SIZE) {
    const oldest = all
      .sort((a, b) => a.queuedAt - b.queuedAt)
      .slice(0, all.length - MAX_QUEUE_SIZE);
    await Promise.all(
      oldest.map(item => offlineDb.delete("gameResultsQueue", item.clientSubmissionId))
    );
  }
  return queued;
}

export async function getQueuedGameResultCount() {
  if (!(await ensureReady())) return 0;
  return (await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue")).length;
}

export async function syncQueuedGameResults() {
  if (typeof navigator === "undefined" || !navigator.onLine) return { sent: 0, remaining: 0 };
  if (!(await ensureReady())) return { sent: 0, remaining: 0 };

  const now = Date.now();
  const queued = await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue");
  let sent = 0;
  for (const item of queued) {
    if (item.nextAttemptAt > now || item.attempts >= MAX_ATTEMPTS) continue;
    try {
      const response = await fetch("/api/kids/games/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gameId: item.gameId,
          score: item.score,
          collectibles: item.collectibles,
          distance: item.distance,
          difficulty: item.difficulty,
          level: item.level,
          combo: item.combo,
          timeSeconds: item.timeSeconds,
          completed: item.completed,
          clientSubmissionId: item.clientSubmissionId,
          metadata: item.metadata,
        }),
      });
      if (response.ok) {
        await offlineDb.delete("gameResultsQueue", item.clientSubmissionId);
        sent += 1;
        continue;
      }
      if (response.status === 400 || response.status === 404) {
        await offlineDb.delete("gameResultsQueue", item.clientSubmissionId);
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      const attempts = item.attempts + 1;
      await offlineDb.set("gameResultsQueue", {
        ...item,
        attempts,
        nextAttemptAt: Date.now() + Math.min(60 * 60 * 1000, BASE_RETRY_MS * 2 ** attempts),
      });
      console.warn("[KidsGame] queued result retry scheduled", error);
    }
  }

  return {
    sent,
    remaining: await getQueuedGameResultCount(),
  };
}

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

  const clientSubmissionId = payload.clientSubmissionId ?? createSubmissionId();
  const all = await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue");
  const existing = all.find(item => item.clientSubmissionId === clientSubmissionId);
  if (existing) return existing;
  if (all.length >= MAX_QUEUE_SIZE) return null;

  const queued: OfflineQueuedResult = {
    ...payload,
    clientSubmissionId,
    queuedAt: Date.now(),
    attempts: 0,
    nextAttemptAt: Date.now(),
    status: "pending",
  };
  await offlineDb.set("gameResultsQueue", queued);
  return queued;
}

export async function getQueuedGameResultCount() {
  if (!(await ensureReady())) return 0;
  const items = await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue");
  return items.filter(item => item.status !== "failed").length;
}

export async function getFailedGameResultCount() {
  if (!(await ensureReady())) return 0;
  const items = await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue");
  return items.filter(item => item.status === "failed").length;
}

export async function retryFailedGameResults() {
  if (!(await ensureReady())) return 0;
  const items = await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue");
  const failed = items.filter(item => item.status === "failed");
  await Promise.all(failed.map(item => offlineDb.set("gameResultsQueue", {
    ...item, status: "pending" as const, attempts: 0, nextAttemptAt: Date.now(), failedAt: undefined, lastError: undefined,
  })));
  return failed.length;
}

export async function syncQueuedGameResults() {
  if (typeof navigator === "undefined" || !navigator.onLine) return { sent: 0, remaining: 0 };
  if (!(await ensureReady())) return { sent: 0, remaining: 0 };

  const now = Date.now();
  const queued = await offlineDb.getAll<OfflineQueuedResult>("gameResultsQueue");
  let sent = 0;
  for (const item of queued) {
    if (item.status === "failed") continue;
    if (item.attempts >= MAX_ATTEMPTS) {
      await offlineDb.set("gameResultsQueue", { ...item, status: "failed", failedAt: Date.now(), lastError: "Retry limit reached" });
      continue;
    }
    if (item.nextAttemptAt > now) continue;
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
      if ([400, 403, 404, 422].includes(response.status)) {
        await offlineDb.set("gameResultsQueue", { ...item, status: "failed", failedAt: Date.now(), lastError: `HTTP ${response.status}` });
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      const attempts = item.attempts + 1;
      const failed = attempts >= MAX_ATTEMPTS;
      await offlineDb.set("gameResultsQueue", {
        ...item,
        attempts,
        status: failed ? "failed" : "pending",
        failedAt: failed ? Date.now() : undefined,
        lastError: error instanceof Error ? error.message.slice(0, 200) : "Unknown sync error",
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

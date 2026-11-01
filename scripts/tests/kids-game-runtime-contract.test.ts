import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const queue = readFileSync("src/lib/games/offline-queue.ts", "utf8");
const registry = readFileSync("src/lib/games/registry.ts", "utf8");
const stage = readFileSync("src/features/kids/components/games/world-game-stage.tsx", "utf8");
const shell = readFileSync("src/features/kids/components/games/game-shell.tsx", "utf8");

assert.ok(!queue.includes("@ts-nocheck"), "offline queue must remain type checked");
assert.ok(!queue.includes("MAX_ATTEMPTS) continue"), "exhausted retries must not remain silently pending");
assert.ok(queue.includes('status: failed ? "failed" : "pending"'), "retry exhaustion must enter a visible failed state");
assert.ok(queue.includes("getFailedGameResultCount"), "failed results must be queryable");
assert.ok(queue.includes("retryFailedGameResults"), "failed results must support explicit recovery");
assert.ok(queue.includes("retryQueuedGameResults"), "pending results must support an explicit sync retry");
assert.ok(queue.includes("if (syncInFlight) return syncInFlight"), "simultaneous sync triggers must share one in-flight request");
assert.ok(queue.includes("response.status === 401"), "unauthenticated sync must wait for a session instead of consuming retries");
assert.ok(queue.includes("response.status === 429"), "rate-limited sync must be rescheduled instead of dead-lettered");
assert.ok(queue.includes("AUTH_RETRY_MS"), "authentication failures must use a longer retry delay");
assert.ok(queue.includes("if (all.length >= MAX_QUEUE_SIZE) return null"), "a full queue must reject new results instead of evicting older results");
assert.ok(!queue.includes(".slice(0, all.length - MAX_QUEUE_SIZE)"), "queue capacity must never silently delete earlier results");
assert.ok(registry.includes('status?: "pending" | "failed"'), "persisted queue status must be typed");
assert.ok(!stage.includes("noopController"), "stage must not advertise a no-op controller");
assert.ok(!stage.includes("StageController"), "stage must not expose an inert controller contract");
assert.ok(stage.includes("onReady: (ready: boolean) => void"), "stage readiness must be explicit");
assert.ok(shell.includes("setPaused(value => !value)"), "pause must update the state consumed by game runtimes");
assert.ok(shell.includes("getFailedGameResultCount"), "the game shell must expose failed queue state");
assert.ok(shell.includes("retryQueuedGameResults"), "the game shell must expose manual pending-result sync");
assert.ok(shell.includes('document.addEventListener("visibilitychange"'), "returning to the game tab must retry eligible queued results");
assert.ok(shell.includes("sync();"), "queued results must be checked when the game shell mounts");
assert.ok(shell.includes("retryFailedGameResults"), "the game shell must let users retry failed results");
assert.ok(!shell.includes("controller"), "the game shell must not retain stale controller references");
assert.ok(shell.includes("Could not store this result offline"), "storage-unavailable and full-queue states must not be mislabeled as the same cause");

console.log("Kids runtime contract passed: offline dead-letter recovery and state-driven pause controls.");

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
assert.ok(registry.includes('status?: "pending" | "failed"'), "persisted queue status must be typed");
assert.ok(!stage.includes("noopController"), "stage must not advertise a no-op controller");
assert.ok(!stage.includes("StageController"), "stage must not expose an inert controller contract");
assert.ok(stage.includes("onReady: (ready: boolean) => void"), "stage readiness must be explicit");
assert.ok(shell.includes("setPaused(value => !value)"), "pause must update the state consumed by game runtimes");
assert.ok(shell.includes("getFailedGameResultCount"), "the game shell must expose failed queue state");
assert.ok(shell.includes("retryFailedGameResults"), "the game shell must let users retry failed results");

console.log("Kids runtime contract passed: offline dead-letter recovery and state-driven pause controls.");

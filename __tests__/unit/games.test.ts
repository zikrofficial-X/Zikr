import assert from "node:assert/strict";
import test from "node:test";
import {
  GAME_REGISTRY,
  calculateBoundedXp,
  getGameDefinition,
  isRegisteredGameId,
  parseGameContentMetadata,
} from "../../lib/games/registry";
import { validateGameResultPayload } from "../../lib/games/validation";
import { enqueueGameResult } from "../../lib/games/offline-queue";
import { getVerifiedWuduSteps } from "../../lib/games/verified-content";

test("game registry resolves ZIKR Runner and rejects unknown IDs", () => {
  assert.equal(isRegisteredGameId("zikr-runner"), true);
  assert.equal(getGameDefinition("zikr-runner")?.version, 1);
  assert.equal(isRegisteredGameId("not-a-game"), false);
  assert.equal(getGameDefinition("not-a-game"), null);
});

test("all twelve Kids World games are registered", () => {
  assert.deepEqual(Object.keys(GAME_REGISTRY).sort(), [
    "good-deeds", "hilal-fly", "mosque-adventure", "mosque-cleanup", "verse-puzzle", "wudu-challenge",
    "zikr-coloring", "zikr-jump", "zikr-memory", "zikr-quiz", "zikr-road", "zikr-runner",
  ]);
  for (const game of Object.values(GAME_REGISTRY)) assert.ok(game.runtimeKind);
});

test("verified Wudu content exposes the approved numbered steps", () => {
  const steps = getVerifiedWuduSteps();
  assert.equal(steps.length, 9);
  assert.equal(steps[0]?.order, 1);
  assert.match(steps[0]?.text ?? "", /النية/);
  assert.equal(steps[8]?.order, 9);
});

test("game metadata accepts only registered IDs", () => {
  assert.deepEqual(parseGameContentMetadata({ gameId: "zikr-runner", version: 1 }), {
    gameId: "zikr-runner",
    version: 1,
    difficulty: "easy",
  });
  assert.equal(parseGameContentMetadata({ gameId: "custom-code" }), null);
  assert.equal(parseGameContentMetadata(null), null);
});

test("score validation rejects spoofed, negative, fractional, and impossible values", () => {
  const valid = validateGameResultPayload({
    gameId: "zikr-runner",
    score: 1200,
    collectibles: 25,
    distance: 1800,
    clientSubmissionId: "submission-1234",
  });
  assert.equal(valid?.gameId, "zikr-runner");
  assert.equal(valid?.difficulty, "easy");
  assert.equal(validateGameResultPayload({ ...valid, gameId: "zikr-memory", score: 100, collectibles: 1, distance: 0, level: 2, combo: 3, completed: true })?.gameId, "zikr-memory");

  assert.equal(validateGameResultPayload({ ...valid, gameId: "other-game" }), null);
  assert.equal(validateGameResultPayload({ ...valid, score: -1 }), null);
  assert.equal(validateGameResultPayload({ ...valid, score: 1.5 }), null);
  assert.equal(validateGameResultPayload({ ...valid, score: 100001 }), null);
  assert.equal(validateGameResultPayload({ ...valid, clientSubmissionId: "short" }), null);
});

test("server XP calculation is bounded and non-negative", () => {
  assert.equal(calculateBoundedXp({ score: 0, collectibles: 0, distance: 0 }), 0);
  assert.equal(calculateBoundedXp({ score: 100000, collectibles: 10000, distance: 1000000, completed: true }), 100);
});

test("offline enqueue degrades safely when IndexedDB is unavailable", async () => {
  const queued = await enqueueGameResult({
    gameId: "zikr-runner",
    score: 10,
    collectibles: 1,
    distance: 20,
  });
  assert.equal(queued, null);
});

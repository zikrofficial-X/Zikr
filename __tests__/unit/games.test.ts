import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBoundedXp,
  getGameDefinition,
  isRegisteredGameId,
  parseGameContentMetadata,
} from "../../lib/games/registry";
import { validateGameResultPayload } from "../../lib/games/validation";
import { enqueueGameResult } from "../../lib/games/offline-queue";

test("game registry resolves ZIKR Runner and rejects unknown IDs", () => {
  assert.equal(isRegisteredGameId("zikr-runner"), true);
  assert.equal(getGameDefinition("zikr-runner")?.version, 1);
  assert.equal(isRegisteredGameId("not-a-game"), false);
  assert.equal(getGameDefinition("not-a-game"), null);
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

  assert.equal(validateGameResultPayload({ ...valid, gameId: "other-game" }), null);
  assert.equal(validateGameResultPayload({ ...valid, score: -1 }), null);
  assert.equal(validateGameResultPayload({ ...valid, score: 1.5 }), null);
  assert.equal(validateGameResultPayload({ ...valid, score: 100001 }), null);
  assert.equal(validateGameResultPayload({ ...valid, clientSubmissionId: "short" }), null);
});

test("server XP calculation is bounded and non-negative", () => {
  assert.equal(calculateBoundedXp({ score: 0, collectibles: 0, distance: 0 }), 0);
  assert.equal(calculateBoundedXp({ score: 100000, collectibles: 10000, distance: 1000000 }), 100);
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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
import { isVerseOrderComplete, shuffleVerseTokens, shuffleWuduSteps } from "../../lib/games/gameplay-helpers";

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

test("Wudu choices are shuffled without changing approved wording", () => {
  const steps = getVerifiedWuduSteps().slice(0, 6);
  const shuffled = shuffleWuduSteps(steps, "test-seed");
  assert.deepEqual(shuffled.map(step => step.text).sort(), steps.map(step => step.text).sort());
  assert.deepEqual(shuffleWuduSteps(steps, "test-seed"), shuffled);
});

test("verse tokens retain source indexes and handle duplicate words", () => {
  const tokens = shuffleVerseTokens(["رب", "رب", "العالمين"], "test-seed");
  assert.deepEqual(tokens.map(token => token.index).sort((a, b) => a - b), [0, 1, 2]);
  assert.equal(tokens.filter(token => token.text === "رب").length, 2);
  assert.equal(isVerseOrderComplete([0, 1, 2], 3), true);
  assert.equal(isVerseOrderComplete([0, 2, 1], 3), false);
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

test("secure result migration keeps persistence behind the server role", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const migration = readFileSync(join(here, "../../supabase/migrations/20260827185900_kids_world_secure_result_processor.sql"), "utf8");
  assert.match(migration, /kids_record_game_result_internal/);
  assert.match(migration, /p_user_id uuid/);
  assert.match(migration, /grant execute[\s\S]+to service_role/);
  assert.match(migration, /revoke all[\s\S]+from public, anon, authenticated/);
  assert.doesNotMatch(migration, /p_xp_awarded/);
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

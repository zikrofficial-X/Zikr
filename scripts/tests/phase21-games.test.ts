import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { GAME_REGISTRY, calculateBoundedXp, getGameDefinition, isRegisteredGameId } from "../../src/lib/games/registry";
import type { GameId } from "../../src/lib/games/registry";
import { KIDS_LEVEL_COUNT, getKidsLevelMeta } from "../../src/lib/games/kids-level-system";
import { getZikrRunnerRules } from "../../src/lib/games/zikr-runner";
import { getZikrRoadRules } from "../../src/lib/games/zikr-road";
import { getZikrJumpRules } from "../../src/lib/games/zikr-jump";
import { getHilalFlyRules } from "../../src/lib/games/hilal-fly";
import { getVersePuzzleReference } from "../../src/lib/games/verse-puzzle";
import { getGoodDeedsRules } from "../../src/lib/games/good-deeds";
import { getMosqueCleanupRules } from "../../src/lib/games/mosque-cleanup";
import { getZikrColoringRules } from "../../src/lib/games/zikr-coloring";
import { normalizeKidsGameSearch } from "../../src/lib/games/search";
import { gameKeyAction } from "../../src/lib/games/gameplay-helpers";
import { accumulateGameLevel, createGameRunTotals } from "../../src/lib/games/run-stats";

const totals1 = accumulateGameLevel(createGameRunTotals(), { score: 120, collectibles: 3, combo: 2 });
const totals2 = accumulateGameLevel(totals1, { score: 80, collectibles: 2, combo: 5 });
assert.deepEqual(totals2, { score: 200, collectibles: 5, bestCombo: 5 });
assert.deepEqual(
  accumulateGameLevel(totals2, { score: -10, collectibles: Number.NaN, combo: 1 }),
  { score: 200, collectibles: 5, bestCombo: 5 },
  "invalid level totals must not decrease or poison a run",
);

const gameIds = Object.keys(GAME_REGISTRY) as GameId[];
assert.equal(gameIds.length, 12, "canonical Kids registry must contain exactly 12 games");
assert.equal(normalizeKidsGameSearch("ذِكْر"), "ذكر", "Arabic search must ignore diacritics");
assert.equal(normalizeKidsGameSearch("إِقْرَأْ القرآن"), "اقرا القران", "Arabic search must normalize common alef forms");
assert.equal(normalizeKidsGameSearch("  زِكْر   "), "زكر", "search normalization must trim and collapse whitespace");

for (const id of gameIds) {
  assert.equal(isRegisteredGameId(id), true, "registry id must be recognized: " + id);
  assert.ok(getGameDefinition(id), "registry definition must exist: " + id);
  assert.deepEqual(
    GAME_REGISTRY[id].difficulties,
    ["easy", "normal", "hard"],
    "all difficulties must remain registered: " + id,
  );

  for (const difficulty of ["easy", "normal", "hard"] as const) {
    const ids = new Set(
      Array.from({ length: KIDS_LEVEL_COUNT }, (_, level) =>
        getKidsLevelMeta(id, difficulty, level).id,
      ),
    );
    assert.equal(ids.size, KIDS_LEVEL_COUNT, "level ids must be unique for " + id + "/" + difficulty);
  }
}

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const verseReferences = Array.from({ length: KIDS_LEVEL_COUNT }, (_, level) =>
    getVersePuzzleReference(difficulty, level),
  );
  assert.equal(
    new Set(verseReferences.map(reference => `${reference.surah}:${reference.ayah}`)).size,
    KIDS_LEVEL_COUNT,
    "each Verse Puzzle level must use a distinct verified ayah for " + difficulty,
  );
}

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const runner = getZikrRunnerRules(difficulty);
  const road = getZikrRoadRules(difficulty);
  const jump = getZikrJumpRules(difficulty);
  const hilal = getHilalFlyRules(difficulty);
  const deeds = getGoodDeedsRules(difficulty);
  const cleanup = getMosqueCleanupRules(difficulty);
  const coloring = getZikrColoringRules(difficulty);

  assert.ok(runner.levelCount >= 20 && runner.speed > 0 && runner.goalDistance > 0);
  assert.ok(road.levelCount >= 20 && road.speed > 0 && road.goalDistance > 0);
  assert.ok(jump.levelCount >= 20 && jump.jumpVelocity > 0 && jump.gravity > 0);
  assert.ok(hilal.levelCount >= 20 && hilal.speed > 0 && hilal.gapHeight > 0);
  assert.ok(deeds.levelCount >= 20 && deeds.sceneCount >= 3 && deeds.rewardPerScene > 0);
  assert.ok(cleanup.levelCount >= 20 && cleanup.itemCount >= 5);
  assert.ok(coloring.levelCount >= 20 && coloring.regionTarget >= 6);
}

assert.equal(calculateBoundedXp({ score: 0, collectibles: 0, distance: 0, completed: false }), 0);
assert.equal(calculateBoundedXp({
  score: Number.MAX_SAFE_INTEGER,
  collectibles: Number.MAX_SAFE_INTEGER,
  distance: Number.MAX_SAFE_INTEGER,
  completed: true,
}), 100);

for (const path of [
  "scripts/verify-kids-games-final.ts",
  "scripts/verify-kids-production.mjs",
  "src/features/kids/components/games/game-shell.tsx",
  "src/features/kids/components/games/world-game-stage.tsx",
]) {
  assert.equal(existsSync(path), true, "required Kids runtime contract missing: " + path);
}

// Controls must work on Arabic keyboard layouts, where event.key is not the Latin letter.
assert.equal(gameKeyAction({ code: "KeyA", key: "ش" }), "left", "A must move left on an Arabic layout");
assert.equal(gameKeyAction({ code: "KeyD", key: "ي" }), "right", "D must move right on an Arabic layout");
assert.equal(gameKeyAction({ code: "KeyW", key: "ص" }), "up", "W must move up on an Arabic layout");
assert.equal(gameKeyAction({ code: "KeyS", key: "س" }), "down", "S must move down on an Arabic layout");
assert.equal(gameKeyAction({ code: "Space", key: " " }), "jump", "Space must jump");
assert.equal(gameKeyAction({ key: "ArrowLeft" }), "left", "arrow keys work without a code");
assert.equal(gameKeyAction({ code: "KeyQ", key: "q" }), null, "unmapped keys do nothing");

console.log("✅ Phase 21 test suite passed: registry, difficulty matrix, deterministic levels, runtime rules, XP bounds and production gate wiring.");

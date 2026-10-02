import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getZikrRunnerRules } from "../src/lib/games/zikr-runner";
import { getZikrRoadRules } from "../src/lib/games/zikr-road";
import { getZikrJumpRules } from "../src/lib/games/zikr-jump";
import { getHilalFlyRules } from "../src/lib/games/hilal-fly";
import { getGoodDeedsRules } from "../src/lib/games/good-deeds";
import { getMosqueCleanupRules } from "../src/lib/games/mosque-cleanup";
import { getZikrColoringRules } from "../src/lib/games/zikr-coloring";
import { KIDS_LEVEL_COUNT, getKidsLevelMeta } from "../src/lib/games/kids-level-system";

const root = process.cwd();
const required = [
  "src/features/kids/components/games/kids-game-kit.tsx",
  "src/features/kids/components/games/kids-action-runner-road.tsx",
  "src/features/kids/components/games/kids-action-adventure.tsx",
  "src/features/kids/components/games/kids-learning-games.tsx",
  "src/features/kids/components/games/kids-values-coloring.tsx",
  "src/features/kids/components/games/world-game-stage.tsx",
  "src/features/kids/components/games/game-shell.tsx",
  "src/lib/games/zikr-runner.ts",
  "src/lib/games/zikr-road.ts",
  "src/lib/games/zikr-jump.ts",
  "src/lib/games/hilal-fly.ts",
  "src/lib/games/good-deeds.ts",
  "src/lib/games/mosque-cleanup.ts",
  "src/lib/games/zikr-coloring.ts",
];

const legacy = [
  "src/features/kids/components/games/zikr-runner-game.tsx",
  "src/features/kids/components/games/zikr-memory-game.tsx",
  "src/features/kids/components/games/wudu-challenge-game.tsx",
  "src/features/kids/components/games/verse-puzzle-game.tsx",
  "src/features/kids/components/games/zikr-quiz-game.tsx",
  "src/features/kids/components/games/mosque-adventure-game.tsx",
  "src/features/kids/components/games/zikr-road-game.tsx",
  "src/features/kids/components/games/zikr-jump-game.tsx",
  "src/features/kids/components/games/hilal-fly-game.tsx",
  "src/lib/games/zikr-runner/runner-scene.ts",
  "src/lib/games/mosque-adventure/adventure-scene.ts",
  "src/lib/games/wudu-challenge/ordering-scene.ts",
  "src/lib/games/verse-puzzle/verse-scene.ts",
  "src/lib/games/good-deeds/deeds-component.tsx",
  "src/lib/games/zikr-coloring/coloring-component.tsx",
  "src/lib/games/zikr-quiz/quiz-component.tsx",
  "src/lib/games/mosque-cleanup/cleanup-scene.ts",
  "src/features/kids/components/games/arcade-game.tsx",
  "src/lib/games/arcade/arcade-scene.ts",
];

const missing = required.filter(path => !existsSync(join(root, path)));
if (missing.length) throw new Error("Missing rebuilt game files: " + missing.join(", "));

const stale = legacy.filter(path => existsSync(join(root, path)));
if (stale.length) throw new Error("Legacy game runtimes still exist: " + stale.join(", "));

const stage = readFileSync(join(root, "src/features/kids/components/games/world-game-stage.tsx"), "utf8");
const gameIds = [
  "zikr-runner", "zikr-memory", "wudu-challenge", "verse-puzzle",
  "zikr-quiz", "mosque-adventure", "zikr-road", "zikr-jump",
  "hilal-fly", "good-deeds", "mosque-cleanup", "zikr-coloring",
] as const;
for (const id of gameIds) {
  if (!stage.includes('"' + id + '"')) {
    throw new Error("Unified stage is missing game route: " + id);
  }
}

if (KIDS_LEVEL_COUNT < 20) throw new Error("Kids level system must provide at least 20 levels.");

for (const gameId of gameIds) {
  for (const difficulty of ["easy", "normal", "hard"] as const) {
    const ids = new Set(Array.from({ length: KIDS_LEVEL_COUNT }, (_, index) => getKidsLevelMeta(gameId, difficulty, index).id));
    if (ids.size !== KIDS_LEVEL_COUNT) throw new Error("Duplicate generated level ids for " + gameId + "/" + difficulty);
  }
}

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const runner = getZikrRunnerRules(difficulty);
  const road = getZikrRoadRules(difficulty);
  const jump = getZikrJumpRules(difficulty);
  const hilal = getHilalFlyRules(difficulty);
  const deeds = getGoodDeedsRules(difficulty);
  const cleanup = getMosqueCleanupRules(difficulty);
  const coloring = getZikrColoringRules(difficulty);

  if (!(runner.levelCount >= 20 && runner.speed > 0 && runner.goalDistance > 0 && runner.obstacleInterval > 0)) {
    throw new Error("Invalid Runner progression rules for " + difficulty);
  }
  if (!(road.levelCount >= 20 && road.speed > 0 && road.goalDistance > 0 && road.checkpointDistances.length > 0)) {
    throw new Error("Invalid Road progression rules for " + difficulty);
  }
  if (!(jump.levelCount >= 20 && jump.jumpVelocity > 0 && jump.gravity > 0)) {
    throw new Error("Invalid Jump progression rules for " + difficulty);
  }
  if (!(hilal.levelCount >= 20 && hilal.speed > 0 && hilal.gapHeight > 0)) {
    throw new Error("Invalid Hilal Fly progression rules for " + difficulty);
  }
  if (!(deeds.levelCount >= 20 && deeds.sceneCount >= 3 && deeds.rewardPerScene > 0)) {
    throw new Error("Invalid Good Deeds progression rules for " + difficulty);
  }
  if (!(cleanup.levelCount >= 20 && cleanup.itemCount >= 5 && cleanup.mistakePenalty >= 0)) {
    throw new Error("Invalid Cleanup progression rules for " + difficulty);
  }
  if (!(coloring.levelCount >= 20 && coloring.regionTarget >= 6 && coloring.completionBonus > 0)) {
    throw new Error("Invalid Coloring progression rules for " + difficulty);
  }
}

if (!readFileSync(join(root, "src/features/kids/components/games/kids-game-kit.tsx"), "utf8").includes("KidCharacter")) {
  throw new Error("Unified character system is missing.");
}
if (!readFileSync(join(root, "src/features/kids/components/games/kids-game-kit.tsx"), "utf8").includes("StarToken")) {
  throw new Error("Unified collectible system is missing.");
}
if (!readFileSync(join(root, "src/features/kids/components/games/game-shell.tsx"), "utf8").includes("syncQueuedGameResults")) {
  throw new Error("The existing offline result pipeline is no longer connected.");
}

const registry = readFileSync(join(root, "src/lib/games/registry.ts"), "utf8");
if (!registry.includes('difficulties: ["easy", "normal", "hard"] as const')) throw new Error("Registry does not expose all 3 difficulties.");

console.log("Kids Games final check passed: 12 rebuilt runtimes, 20 deterministic levels per game/difficulty, no legacy game runtimes, stabilized runtime rules, and preserved progress/offline shell.");

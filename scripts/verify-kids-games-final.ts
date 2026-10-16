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
  "src/lib/games/game-missions.ts",
  "src/features/kids/components/games/kids-game-art.tsx",
  "supabase/migrations/20261002211738_20261003010000_kids_games_level_catalog.sql",
  "src/features/kids/components/games/kids-game-visuals.tsx",
  "supabase/migrations/20261002212922_20261003030000_kids_games_gameplay_visual_catalog.sql",
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

  if (!(runner.levelCount >= 20 && runner.speed > 0 && runner.goalDistance > 0 && runner.obstacleInterval > 0)) throw new Error("Invalid Runner progression rules for " + difficulty);
  if (!(road.levelCount >= 20 && road.speed > 0 && road.goalDistance > 0 && road.checkpointDistances.length > 0)) throw new Error("Invalid Road progression rules for " + difficulty);
  if (!(jump.levelCount >= 20 && jump.jumpVelocity > 0 && jump.gravity > 0)) throw new Error("Invalid Jump progression rules for " + difficulty);
  if (!(hilal.levelCount >= 20 && hilal.speed > 0 && hilal.gapHeight > 0)) throw new Error("Invalid Hilal Fly progression rules for " + difficulty);
  if (!(deeds.levelCount >= 20 && deeds.sceneCount >= 3 && deeds.rewardPerScene > 0)) throw new Error("Invalid Good Deeds progression rules for " + difficulty);
  if (!(cleanup.levelCount >= 20 && cleanup.itemCount >= 5 && cleanup.mistakePenalty >= 0)) throw new Error("Invalid Cleanup progression rules for " + difficulty);
  if (!(coloring.levelCount >= 20 && coloring.regionTarget >= 6 && coloring.completionBonus > 0)) throw new Error("Invalid Coloring progression rules for " + difficulty);
}

if (!readFileSync(join(root, "src/features/kids/components/games/kids-game-kit.tsx"), "utf8").includes("KidCharacter")) throw new Error("Unified character system is missing.");
if (!readFileSync(join(root, "src/features/kids/components/games/kids-game-kit.tsx"), "utf8").includes("StarToken")) throw new Error("Unified collectible system is missing.");
if (!readFileSync(join(root, "src/features/kids/components/games/game-shell.tsx"), "utf8").includes("syncQueuedGameResults")) throw new Error("The existing offline result pipeline is no longer connected.");

const shellSource = readFileSync(join(root, "src/features/kids/components/games/game-shell.tsx"), "utf8");
if (!shellSource.includes("getDailyMission") || !shellSource.includes("dailyMissionCompleted")) throw new Error("Daily mission integration is missing.");
if (!shellSource.includes("elapsedSeconds") || !shellSource.includes("roundTimeSeconds")) throw new Error("Round timing statistics are missing.");
const artIndexSource = readFileSync(join(root, "src/features/kids/components/games/games-index.tsx"), "utf8");
if (!artIndexSource.includes("KidsGameArt")) throw new Error("Unique game art is not connected.");
const missionSource = readFileSync(join(root, "src/lib/games/game-missions.ts"), "utf8");
if (!missionSource.includes("getDailyMission") || !missionSource.includes("getMissionProgress")) throw new Error("Game mission system is incomplete.");
const artSource = readFileSync(join(root, "src/features/kids/components/games/kids-game-art.tsx"), "utf8");
for (const id of gameIds) if (!artSource.includes('case "' + id + '"')) throw new Error("Visual identity missing for " + id);
const migrationSource = readFileSync(join(root, "supabase/migrations/20261002211738_20261003010000_kids_games_level_catalog.sql"), "utf8");
if (!migrationSource.includes("generate_series(1, 20)") || !migrationSource.includes("array['easy','normal','hard']")) throw new Error("Level catalog migration incomplete.");
for (const id of gameIds) if (!migrationSource.includes("('" + id + "'")) throw new Error("Migration catalog missing " + id);

const visuals = readFileSync(join(root, "src/features/kids/components/games/kids-game-visuals.tsx"), "utf8");
for (const id of gameIds) if (!visuals.includes('case "' + id + '"')) throw new Error("Dedicated visual world missing for " + id);
const kit = readFileSync(join(root, "src/features/kids/components/games/kids-game-kit.tsx"), "utf8");
for (const scene of ["scene-moon-sky.webp", "scene-mosque-courtyard.webp", "scene-night-garden.webp"]) {
  if (!kit.includes(scene)) throw new Error("High-resolution game background is not connected: " + scene);
}
if (kit.includes("aspect-[16/9]") || !kit.includes("min-h-[460px]") || !kit.includes("max-w-5xl") || !kit.includes("overflow-hidden") || !kit.includes("backgroundSize: \"cover\"")) throw new Error("Responsive content-driven game stage contract is incomplete.");
const tone = readFileSync(join(root, "src/lib/games/tone-feedback.ts"), "utf8");
if (!tone.includes("this.music?.pause()") || !tone.includes("this.music.play()")) throw new Error("Mute/unmute audio recovery is incomplete.");
const runtimeFiles: Record<string, string> = {
  "src/features/kids/components/games/kids-action-runner-road.tsx": "zikr-runner,zikr-road",
  "src/features/kids/components/games/kids-action-adventure.tsx": "zikr-jump,hilal-fly,mosque-adventure",
  "src/features/kids/components/games/kids-learning-games.tsx": "zikr-memory,wudu-challenge,verse-puzzle,zikr-quiz",
  "src/features/kids/components/games/kids-values-coloring.tsx": "good-deeds,mosque-cleanup,zikr-coloring",
};
for (const [path, ids] of Object.entries(runtimeFiles)) {
  const source = readFileSync(join(root, path), "utf8");
  for (const id of ids.split(",")) if (!source.includes('<KidsGameWorld gameId="' + id + '" />')) throw new Error("World scene is not mounted for " + id);
}
const learning = readFileSync(join(root, "src/features/kids/components/games/kids-learning-games.tsx"), "utf8");
if (!learning.includes("useHint") && !learning.includes("useVerseHint")) throw new Error("Hint mechanics missing from learning games.");
if (!learning.includes("useFiftyFifty")) throw new Error("Quiz 50/50 mechanic missing.");
if (!learning.includes("getVerifiedWuduContent")) throw new Error("Verified Wudu content path missing.");
const values = readFileSync(join(root, "src/features/kids/components/games/kids-values-coloring.tsx"), "utf8");
if (!values.includes("actionSteps")) throw new Error("Good Deeds multi-step interaction missing.");
const coloringCatalog = values.split("const COLORING_SHEETS: ColoringSheet[] = [")[1]?.split("\\n];")[0] ?? "";
const coloringSheetIds = [...coloringCatalog.matchAll(/id: "([^"]+)"/g)].map(match => match[1]);
if (coloringSheetIds.length < 6 || new Set(coloringSheetIds).size !== coloringSheetIds.length) {
  throw new Error("Coloring requires at least six unique artwork scenes.");
}
if (!values.includes('role: "button" as const') || !values.includes("tabIndex: 0") || !values.includes("onKeyDown: (event: ReactKeyboardEvent<SVGElement>)")) {
  throw new Error("Coloring regions must be accessible by keyboard, not only pointer.");
}
if (!values.includes("onDragStart") || !values.includes("onDrop")) throw new Error("Mosque Cleanup drag-and-drop interaction missing.");
if (!values.includes("mixColor")) throw new Error("Color mixing interaction missing.");
const gameplayMigration = readFileSync(join(root, "supabase/migrations/20261002212922_20261003030000_kids_games_gameplay_visual_catalog.sql"), "utf8");
if (!gameplayMigration.includes("gameplayVersion", 0) || !gameplayMigration.includes("visualVersion")) throw new Error("Gameplay/visual catalog migration is incomplete.");

const registry = readFileSync(join(root, "src/lib/games/registry.ts"), "utf8");
if (!registry.includes('difficulties: ["easy", "normal", "hard"] as const')) throw new Error("Registry does not expose all 3 difficulties.");
const kidsDetailPage = readFileSync(join(root, "src/app/kids/[slug]/page.tsx"), "utf8");
if (!kidsDetailPage.includes("const isLegacyGameActivity = content?.type === \"game\" && !gameConfig;")) {
  throw new Error("Legacy kids activities must be distinguished from registry-configured games.");
}
if (!kidsDetailPage.includes('isLegacyGameActivity && quizQuestions.length > 0')) {
  throw new Error("Published legacy game activities with questions must retain their quiz interaction.");
}
if (!kidsDetailPage.includes("content.metadata.activitySteps.map")) {
  throw new Error("Legacy kids game activities must render their authored activity steps.");
}
if (!kidsDetailPage.includes("!isEnglish && Array.isArray(content.metadata?.activitySteps)")) {
  throw new Error("Arabic-only legacy activity steps must not be injected into the English interface.");
}
if (kidsDetailPage.includes('isEnglish ? "Game unavailable"')) {
  throw new Error("Published legacy activities must not be discarded solely because they lack a registry gameId.");
}

console.log("Kids Games final check passed: 12 rebuilt runtimes, 20 deterministic levels per game/difficulty, no legacy game runtimes, stabilized runtime rules, and preserved progress/offline shell.");

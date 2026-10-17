import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GAME_REGISTRY } from "../../src/lib/games/registry";
import { getGameInstructions } from "../../src/lib/games/game-instructions";

const gameIds = Object.keys(GAME_REGISTRY) as Array<keyof typeof GAME_REGISTRY>;
const artSource = readFileSync("src/features/kids/components/games/kids-game-art.tsx", "utf8");
const stageSource = readFileSync("src/features/kids/components/games/world-game-stage.tsx", "utf8");
const adventureSource = readFileSync("src/features/kids/components/games/kids-action-adventure.tsx", "utf8");
const jumpRuntime = adventureSource.split("export function ZikrJumpGame")[1]?.split("export function HilalFlyGame")[0] ?? "";
const hilalRuntime = adventureSource.split("export function HilalFlyGame")[1]?.split("export function MosqueAdventureGame")[0] ?? "";
const runnerRoadSource = readFileSync("src/features/kids/components/games/kids-action-runner-road.tsx", "utf8");
const learningGamesSource = readFileSync("src/features/kids/components/games/kids-learning-games.tsx", "utf8");
const runnerRuntime = runnerRoadSource.split("export function ZikrRunnerGame")[1]?.split("export function ZikrRoadGame")[0] ?? "";
const roadRuntime = runnerRoadSource.split("export function ZikrRoadGame")[1] ?? "";
const quizRuntime = learningGamesSource.split("export function ZikrQuizGame")[1] ?? "";
const homeSource = readFileSync("src/app/kids/page.tsx", "utf8");
const shellSource = readFileSync("src/features/kids/components/games/game-shell.tsx", "utf8");

assert.equal(gameIds.length, 12, "the canonical Kids catalog must continue to expose 12 games");
assert.match(artSource, /useId\(\)/, "SVG artwork IDs must be unique when cards repeat on the same page");
assert.match(artSource, /aria-label": label/, "game illustrations need a localized accessible name");
assert.match(homeSource, /KidsGameArt/, "the Kids landing page must show game-specific artwork");
assert.match(shellSource, /KidsGameArt/, "active gameplay must show game-specific artwork");
assert.match(shellSource, /setHasStarted\(true\)/, "gameplay must start from an explicit start action");
assert.match(shellSource, /!hasStarted \|\| paused/, "timer must remain stopped before play and while paused");
assert.match(shellSource, /\{!hasStarted && !englishSourceMissing/, "a briefing must appear before gameplay runtime mounting");
assert.match(shellSource, /const openHelp = useCallback/, "active games must provide a reusable help action");
assert.match(shellSource, /wasPausedBeforeHelpRef\.current = paused/, "help must remember whether the game was already paused");
assert.match(shellSource, /setPaused\(wasPausedBeforeHelpRef\.current\)/, "closing help must restore the previous pause state");
assert.match(shellSource, /instructions\.success/, "the personalized success reminder must be shown to the player");
assert.match(shellSource, /aria-modal="true"/, "in-game help must be announced as a modal dialog");

const artCases = artSource.match(/case "[a-z-]+":/g) ?? [];
assert.equal(artCases.length, gameIds.length, "every game needs one explicit art scene");
const runtimeCases = stageSource.match(/case "[a-z-]+":/g) ?? [];
assert.equal(runtimeCases.length, gameIds.length, "every registered game needs an explicit gameplay dispatch");

for (const id of gameIds) {
  const game = GAME_REGISTRY[id];
  assert.ok(artSource.includes('case "' + id + '":'), "missing original artwork for " + id);
  assert.ok(stageSource.includes('case "' + id + '":'), "missing gameplay runtime for " + id);
  assert.ok(game.titleAr.trim().length > 0 && game.titleEn.trim().length > 0, "game names must be localized: " + id);
  assert.ok(game.descriptionAr.trim().length > 0 && game.goalAr.trim().length > 0, "game content and goal must be defined: " + id);
  assert.ok(game.runtimeKind, "each game must have a distinct registered runtime kind: " + id);
  const arabicGuide = getGameInstructions(id, "ar");
  const englishGuide = getGameInstructions(id, "en");
  assert.equal(arabicGuide.steps.length, 3, "Arabic guide must have three actionable steps: " + id);
  assert.equal(englishGuide.steps.length, 3, "English guide must have three actionable steps: " + id);
  assert.ok(arabicGuide.title.trim() && arabicGuide.intro.trim(), "Arabic guide needs a title and introduction: " + id);
  assert.ok(englishGuide.title.trim() && englishGuide.intro.trim(), "English guide needs a title and introduction: " + id);
  assert.ok(arabicGuide.touchControls.trim() && arabicGuide.keyboardControls.trim(), "Arabic controls must be documented: " + id);
  assert.ok(englishGuide.touchControls.trim() && englishGuide.keyboardControls.trim(), "English controls must be documented: " + id);
}

assert.equal(
  new Set(gameIds.map((id) => GAME_REGISTRY[id].titleAr)).size,
  gameIds.length,
  "each game must have its own Arabic identity",
);
assert.equal(
  new Set(gameIds.map((id) => GAME_REGISTRY[id].runtimeKind)).size,
  gameIds.length,
  "each game must retain its own gameplay runtime",
);

assert.match(shellSource, /if \(!hasStarted \|\| paused \|\| result \|\| document\.visibilityState === "hidden"\)/, "the elapsed clock must stop before play, while paused, after results, and in hidden tabs");
assert.match(shellSource, /document\.addEventListener\("visibilitychange", handleVisibilityChange\)/, "the game shell must react to tab visibility changes");
assert.match(shellSource, /document\.removeEventListener\("visibilitychange", handleVisibilityChange\)/, "the game shell must remove the visibility listener on cleanup");
assert.match(shellSource, /if \(document\.visibilityState === "hidden"\)\s*stopClock\(\);\s*else startClock\(\);/, "returning to the visible tab must restart only the eligible clock");
assert.match(shellSource, /elapsedRef\.current = 0;\s+runningSinceRef\.current = null;\s+setElapsedSeconds\(0\);/, "restart must reset both elapsed-time sources");
assert.match(shellSource, /setResult\(null\); setMessage\(""\);/, "restart must clear the previous result and status message");
assert.match(shellSource, /setResult\(null\); setMessage\(""\); setPaused\(false\); setRestartToken\(value => value \+ 1\);/, "restart must clear results, unpause, and produce a fresh runtime token");
assert.match(shellSource, /if \(!controller \|\| result\) return;/, "pause/resume must be blocked when the controller is unavailable or the round has ended");
assert.match(shellSource, /if \(paused\) \{ controller\.resume\(\); setPaused\(false\); \} else \{ controller\.pause\(\); setPaused\(true\); \}/, "pause/resume must call the runtime controller as well as update UI state");
assert.match(shellSource, /const completedRound = \{ \.\.\.next, timeSeconds: Math\.max\(0, Math\.floor\(next\.timeSeconds \?\? getElapsedSeconds\(\)\)\) \};/, "result submission must capture a non-negative final elapsed time");
assert.match(shellSource, /setHud\(completedRound\); setResult\(completedRound\); setPaused\(false\); void submitResult\(completedRound\)/, "completed result must update the result screen and submit through the existing pipeline");

assert.match(jumpRuntime, /aria-label=\{isEnglish \? "Move left" : "تحرك لليسار"\}/, "ZIKR Jump left control needs a localized accessible name");
assert.match(jumpRuntime, /aria-label=\{isEnglish \? "Jump" : "قفز"\}/, "ZIKR Jump action control needs an explicit accessible name");
assert.match(jumpRuntime, /aria-label=\{isEnglish \? "Move right" : "تحرك لليمين"\}/, "ZIKR Jump right control needs a localized accessible name");
assert.equal((jumpRuntime.match(/disabled=\{paused \|\| snapshot\.completed \|\| snapshot\.gameOver\}/g) ?? []).length, 3, "ZIKR Jump touch controls must be disabled while paused or after the round ends");
assert.match(jumpRuntime, /if \(paused \|\| stateRef\.current\.completed \|\| stateRef\.current\.gameOver\) return;/, "ZIKR Jump must ignore keyboard input while paused or after the round ends");
assert.match(jumpRuntime, /window\.addEventListener\("blur", clearInputs\)/, "ZIKR Jump must clear held controls when the window loses focus");
assert.match(jumpRuntime, /document\.addEventListener\("visibilitychange", clearInputsOnVisibilityChange\)/, "ZIKR Jump must clear held controls when the document becomes hidden");

assert.equal((hilalRuntime.match(/disabled=\{paused \|\| state\.completed \|\| state\.gameOver\}/g) ?? []).length, 2, "Hilal Fly touch controls must be disabled while paused or after the round ends");
assert.match(hilalRuntime, /if \(paused \|\| stateRef\.current\.completed \|\| stateRef\.current\.gameOver\) return;/, "Hilal Fly must ignore keyboard input while paused or after the round ends");
assert.match(hilalRuntime, /inputRef\.current = \{ up: false, down: false \}/, "Hilal Fly must clear held controls when paused or finished");
assert.match(hilalRuntime, /window\.addEventListener\("blur", clearInputs\)/, "Hilal Fly must clear held controls when the window loses focus");
assert.match(hilalRuntime, /document\.addEventListener\("visibilitychange", clearInputsOnVisibilityChange\)/, "Hilal Fly must clear held controls when the document becomes hidden");

assert.match(runnerRuntime, /if \(paused \|\| selectedAnswer !== null \|\| !question\) return;/, "ZIKR Runner must reject checkpoint answers while paused");
assert.match(runnerRuntime, /disabled=\{paused \|\| selectedAnswer !== null\}/, "ZIKR Runner checkpoint options must appear disabled while paused");
assert.match(roadRuntime, /if \(paused \|\| !question \|\| answer !== null\) return;/, "ZIKR Road must reject checkpoint answers while paused");
assert.match(roadRuntime, /disabled=\{paused \|\| answer !== null\}/, "ZIKR Road checkpoint options must appear disabled while paused");
assert.match(quizRuntime, /disabled=\{paused \|\| selected !== null \|\| hidden\}/, "ZIKR Quiz options must appear disabled while paused");

console.log("✅ Kids visual contract passed: localized art, unique SVG ids, accessible controls, 12 art scenes and 12 runtime dispatches.");

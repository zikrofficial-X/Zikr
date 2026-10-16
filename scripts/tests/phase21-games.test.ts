import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
import { getZikrColoringRules, getZikrColoringSheetIndex } from "../../src/lib/games/zikr-coloring";
import { normalizeKidsGameSearch } from "../../src/lib/games/search";
import { gameKeyAction } from "../../src/lib/games/gameplay-helpers";
import { accumulateGameLevel, createGameRunTotals } from "../../src/lib/games/run-stats";
import { getApprovedRoadQuestions, getApprovedScenarioQuestions } from "../../src/lib/games/verified-content";

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

const learningGamesSource = readFileSync("src/features/kids/components/games/kids-learning-games.tsx", "utf8");
assert.equal(learningGamesSource.split("const { isEnglish } = useLanguage();").length - 1, 4, "all four learning games must read the selected language");
for (const label of ["ZIKR Memory", "Wudu Challenge", "Verse Puzzle", "ZIKR Quiz", "MEMORY_SITUATIONS_EN", "Before sleeping"]) {
  assert.ok(learningGamesSource.includes(label), "learning games localization/content contract is missing: " + label);
}
for (const note of [
  "Dhikr phrases remain in their verified Arabic wording.",
  "Step wording remains in the verified Arabic source.",
  "Quran text is kept in its verified original Arabic wording.",
  "Question text and answer choices remain in their verified original Arabic wording."
]) {
  assert.ok(learningGamesSource.includes(note), "English mode must explain preserved source-language content: " + note);
}
assert.ok(learningGamesSource.includes("getVerifiedMemoryPairs") && learningGamesSource.includes("getVerifiedWuduContent") && learningGamesSource.includes("getVerifiedKidsQuizQuestions"), "localization must preserve verified content adapters");
const memoryGlossary = learningGamesSource.split("const MEMORY_SITUATIONS_EN: Record<string, string> = {")[1]?.split("};")[0] ?? "";
assert.equal((memoryGlossary.match(/: "/g) ?? []).length, 11, "every verified Memory situation needs an English label");
assert.ok(learningGamesSource.includes("const cardAccessibleLabel = visible"), "Memory cards need state-aware accessible names");
assert.ok(learningGamesSource.includes("const pairs = useMemo(() => getVerifiedMemoryPairs(), []);"), "Memory must keep the verified card pool stable across renders");
assert.ok(learningGamesSource.includes("aria-label={cardAccessibleLabel}") && learningGamesSource.includes("aria-pressed={visible}"), "Memory cards must expose visible/flipped state to assistive technology");
assert.ok(learningGamesSource.includes('label={isEnglish ? "Pairs " + matched.length / 2 + "/" + pairTarget : "الأزواج " + matched.length / 2 + "/" + pairTarget}'), "Memory progress text must describe matched pairs rather than overall level count");
assert.ok(learningGamesSource.includes('label: isEnglish ? "Score"'), "learning-game HUD labels must follow the selected language");

const coloringSource = readFileSync("src/features/kids/components/games/kids-values-coloring.tsx", "utf8");
const coloringCatalog = coloringSource.split("const COLORING_SHEETS: ColoringSheet[] = [")[1]?.split("];")[0] ?? "";
const coloringSheetIds = [...coloringCatalog.matchAll(/id: "([^"]+)"/g)].map(match => match[1]);
assert.ok(coloringSheetIds.length >= 6, "Coloring must offer at least six original scenes");
assert.equal(new Set(coloringSheetIds).size, coloringSheetIds.length, "Coloring scene IDs must be unique");
assert.ok(coloringSource.includes("lantern-street") && coloringSource.includes("kite-meadow") && coloringSource.includes("starry-village"), "all additional coloring scenes must have runtime artwork");
assert.ok(coloringSource.includes('role: "button" as const') && coloringSource.includes("tabIndex: 0") && coloringSource.includes("onKeyDown: (event: ReactKeyboardEvent<SVGElement>)"), "coloring regions must support keyboard use");
const deedCatalog = coloringSource.split("const DEEDS: Deed[] = [")[1]?.split("];")[0] ?? "";
const cleanupItemsCatalog = coloringSource.split("const CLEANUP_ITEMS: CleanupItem[] = [")[1]?.split("];")[0] ?? "";
const cleanupZonesCatalog = coloringSource.split("const CLEANUP_ZONES: CleanupZone[] = [")[1]?.split("];")[0] ?? "";
assert.equal((deedCatalog.match(/, titleEn:/g) ?? []).length, 12, "all Good Deeds scenes need English titles");
assert.equal((deedCatalog.match(/descriptionEn:/g) ?? []).length, 12, "all Good Deeds scenes need English descriptions");
assert.equal((cleanupItemsCatalog.match(/nameEn:/g) ?? []).length, 16, "all Cleanup items need English names");
assert.equal((cleanupZonesCatalog.match(/titleEn:/g) ?? []).length, 4, "all Cleanup zones need English titles");
assert.equal((coloringCatalog.match(/, titleEn:/g) ?? []).length, 6, "all Coloring scenes need English titles");
assert.equal((coloringCatalog.match(/subtitleEn:/g) ?? []).length, 6, "all Coloring scenes need English descriptions");
assert.equal(coloringSource.split("const { isEnglish } = useLanguage();").length - 1, 3, "all three games must read the selected language");
assert.ok(coloringSource.includes('title={isEnglish ? "Good Deeds Adventure"') && coloringSource.includes('title={isEnglish ? "Organize the Place"') && coloringSource.includes('title={isEnglish ? "ZIKR Coloring Studio"'), "all three values games need localized titles");
for (const difficulty of ["easy", "normal", "hard"] as const) {
  const sceneIndexes = Array.from({ length: KIDS_LEVEL_COUNT }, (_, level) =>
    getZikrColoringSheetIndex(difficulty, level, coloringSheetIds.length),
  );
  assert.equal(
    new Set(sceneIndexes).size,
    coloringSheetIds.length,
    "all six Coloring scenes must be reachable in every difficulty: " + difficulty,
  );
}

const adventureQuestions = getApprovedScenarioQuestions();
const roadQuestions = getApprovedRoadQuestions();
assert.ok(adventureQuestions.length >= 15, "Mosque Adventure must draw from the complete approved scenario pool");
assert.equal(
  new Set(adventureQuestions.map(question => question.text.trim().replace(/\s+/g, " ").toLocaleLowerCase())).size,
  adventureQuestions.length,
  "Mosque Adventure scenario prompts must not repeat after whitespace/case normalization",
);
assert.equal(roadQuestions.length, adventureQuestions.length, "Road and Mosque Adventure must share the same canonical scenario pool");
for (const sourceSlug of ["game-scenario-smart-choice", "quiz-akhlaq-adventure", "quiz-akhlaq-daily-life"]) {
  assert.ok(adventureQuestions.some(question => question.sourceSlug === sourceSlug), "scenario pool missing approved source " + sourceSlug);
}
for (const question of adventureQuestions) {
  assert.ok(question.text.trim().length > 0, "scenario prompt must not be empty");
  assert.ok(question.options.length >= 2, "scenario must have at least two choices: " + question.text);
  assert.ok(Number.isInteger(question.correctAnswer) && question.correctAnswer >= 0 && question.correctAnswer < question.options.length, "scenario answer index must be valid: " + question.text);
}
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

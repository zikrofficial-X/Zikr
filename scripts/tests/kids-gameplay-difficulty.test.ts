import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getZikrRunnerRules } from "../../src/lib/games/zikr-runner";
import { getZikrRoadRules } from "../../src/lib/games/zikr-road";
import { getZikrJumpRules, getZikrJumpLevels } from "../../src/lib/games/zikr-jump";
import { getHilalFlyRules, getHilalFlyLevels } from "../../src/lib/games/hilal-fly";
import { getGoodDeedsRules } from "../../src/lib/games/good-deeds";
import { getMosqueCleanupRules } from "../../src/lib/games/mosque-cleanup";
import { getZikrColoringRules, getZikrColoringSheetIndex } from "../../src/lib/games/zikr-coloring";
import { getVersePuzzleRules } from "../../src/lib/games/verse-puzzle";
import { getVerifiedMemoryPairs } from "../../src/lib/games/verified-content";
import { KIDS_LEVEL_COUNT } from "../../src/lib/games/kids-level-system";

const difficulties = ["easy", "normal", "hard"] as const;
const runner = difficulties.map(getZikrRunnerRules);
assert.ok(runner[0].speed < runner[1].speed && runner[1].speed < runner[2].speed, "Runner speed must increase by difficulty");
assert.ok(runner[0].goalDistance < runner[1].goalDistance && runner[1].goalDistance < runner[2].goalDistance, "Runner goal distance must increase by difficulty");
assert.ok(runner[0].obstacleInterval > runner[1].obstacleInterval && runner[1].obstacleInterval > runner[2].obstacleInterval, "Runner obstacles must appear more frequently at higher difficulty");
assert.ok(runner[0].lives > runner[1].lives && runner[1].lives > runner[2].lives, "Runner lives must decrease by difficulty");

const road = difficulties.map(getZikrRoadRules);
assert.ok(road[0].speed < road[1].speed && road[1].speed < road[2].speed, "Road speed must increase by difficulty");
assert.ok(road[0].hazardInterval > road[1].hazardInterval && road[1].hazardInterval > road[2].hazardInterval, "Road hazards must become more frequent at higher difficulty");
assert.ok(road[0].mistakePenalty < road[1].mistakePenalty && road[1].mistakePenalty < road[2].mistakePenalty, "Road penalties must increase by difficulty");
assert.ok(road[0].checkpointDistances.length < road[1].checkpointDistances.length && road[1].checkpointDistances.length < road[2].checkpointDistances.length, "Road must add learning checkpoints at higher difficulty");

const jump = difficulties.map(getZikrJumpRules);
assert.ok(jump[0].lives > jump[1].lives && jump[1].lives > jump[2].lives, "Jump lives must decrease by difficulty");
assert.ok(jump[0].gravity < jump[1].gravity && jump[1].gravity < jump[2].gravity, "Jump gravity must increase by difficulty");
assert.ok(jump[0].horizontalSpeed < jump[1].horizontalSpeed && jump[1].horizontalSpeed < jump[2].horizontalSpeed, "Jump horizontal speed must increase by difficulty");
const jumpLevels = difficulties.map(getZikrJumpLevels);
assert.equal(jumpLevels[0].length, KIDS_LEVEL_COUNT, "Easy Jump must expose the full level catalog");
assert.ok(jumpLevels[0].every(level => level.hazards.length === 0), "Easy Jump must omit hazards");
const jumpHazards = jumpLevels.map(levels => levels.reduce((sum, level) => sum + level.hazards.length, 0));
assert.ok(jumpHazards[0] < jumpHazards[1] && jumpHazards[1] < jumpHazards[2], "Jump hazard count must rise by difficulty");

const hilal = difficulties.map(getHilalFlyRules);
assert.ok(hilal[0].speed < hilal[1].speed && hilal[1].speed < hilal[2].speed, "Crescent Flight speed must increase by difficulty");
assert.ok(hilal[0].gapHeight > hilal[1].gapHeight && hilal[1].gapHeight > hilal[2].gapHeight, "Crescent Flight openings must narrow by difficulty");
assert.ok(hilal[0].spawnInterval > hilal[1].spawnInterval && hilal[1].spawnInterval > hilal[2].spawnInterval, "Crescent Flight obstacles must spawn more frequently at higher difficulty");
assert.ok(hilal[0].lives > hilal[1].lives && hilal[1].lives > hilal[2].lives, "Crescent Flight lives must decrease by difficulty");
const hilalLevels = difficulties.map(getHilalFlyLevels);
assert.equal(hilalLevels[0].length, KIDS_LEVEL_COUNT, "Crescent Flight must retain the full level catalog");

const deeds = difficulties.map(difficulty => getGoodDeedsRules(difficulty, 0));
assert.deepEqual(deeds.map(rule => rule.sceneCount), [3, 4, 5], "Good Deeds scene count must increase by difficulty");
const cleanup = difficulties.map(difficulty => getMosqueCleanupRules(difficulty, 0));
assert.deepEqual(cleanup.map(rule => rule.itemCount), [5, 8, 10], "Cleanup item count must increase by difficulty");
assert.ok(cleanup[0].mistakePenalty < cleanup[1].mistakePenalty && cleanup[1].mistakePenalty < cleanup[2].mistakePenalty, "Cleanup penalties must increase by difficulty");
const coloring = difficulties.map(difficulty => getZikrColoringRules(difficulty, 0));
assert.deepEqual(coloring.map(rule => rule.regionTarget), [6, 8, 9], "Coloring region target must increase by difficulty");
assert.ok(coloring[0].completionBonus < coloring[1].completionBonus && coloring[1].completionBonus < coloring[2].completionBonus, "Coloring completion reward must increase by difficulty");
for (const difficulty of difficulties) {
  const reachable = Array.from({ length: KIDS_LEVEL_COUNT }, (_, level) => getZikrColoringSheetIndex(difficulty, level, 6));
  assert.equal(new Set(reachable).size, 6, "Every Coloring difficulty must reach all six scenes");
}

const verse = difficulties.map(getVersePuzzleRules);
assert.equal(verse[0].allowHint, true, "Easy Verse Puzzle must allow hints");
assert.equal(verse[1].allowHint, false, "Normal Verse Puzzle must disable hints");
assert.equal(verse[2].allowHint, false, "Hard Verse Puzzle must disable hints");
assert.equal(verse[2].resetOnMistake, true, "Hard Verse Puzzle must restart the word order after a mistake");
assert.ok(verse[0].mistakePenalty < verse[1].mistakePenalty && verse[1].mistakePenalty < verse[2].mistakePenalty, "Verse Puzzle penalties must increase by difficulty");

const memoryPairs = getVerifiedMemoryPairs();
const distinctDhikrCount = new Set(memoryPairs.map(pair => pair.dhikr.trim())).size;
assert.equal(memoryPairs.length, 11, "Memory must use all 11 verified source pairs");
assert.ok(distinctDhikrCount >= 6, "Memory source pool must contain enough distinct dhikr for its hard boards");
const learningSource = readFileSync("src/features/kids/components/games/kids-learning-games.tsx", "utf8");
assert.match(learningSource, /const pairTarget = Math\.max\(2, Math\.min\(pairs\.length, \(difficulty === "easy" \? 3 : difficulty === "normal" \? 4 : 5\) \+ \(levelIndex % 2\)\)\)/, "Memory must increase pair targets by difficulty and alternating level");
assert.match(learningSource, /const baseCount = difficulty === "easy" \? Math\.min\(5, content\.steps\.length\) : difficulty === "normal" \? Math\.min\(7, content\.steps\.length\) : content\.steps\.length;/, "Wudu step count must change by difficulty");
assert.match(learningSource, /const count = Math\.max\(4, Math\.min\(allQuestions\.length, \(difficulty === "hard" \? 10 : difficulty === "normal" \? 7 : 5\) \+ \(levelIndex % 2\)\)\)/, "Quiz question count must change by difficulty");

console.log("Kids gameplay difficulty contract passed for Runner, Road, Jump, Crescent Flight, Memory, Wudu, Verse Puzzle, Quiz, Good Deeds, Cleanup, and Coloring.");

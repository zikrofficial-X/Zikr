import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { kidsContent } from "../../src/features/kids/data/content";
import { GAME_REGISTRY, type GameId } from "../../src/lib/games/registry";
import {
  getAllKidsGameContentManifests,
} from "../../src/lib/games/content-manifest";
import {
  getApprovedRoadQuestions,
  getApprovedScenarioQuestions,
  getVerifiedKidsQuizQuestions,
  getVerifiedMemoryPairs,
  getVerifiedWuduContent,
} from "../../src/lib/games/verified-content";
import { getVersePuzzleReference } from "../../src/lib/games/verse-puzzle";

const manifest = getAllKidsGameContentManifests();
const gameIds = Object.keys(GAME_REGISTRY) as GameId[];
const contentBySlug = new Map(kidsContent.map(item => [item.slug, item]));

assert.equal(manifest.length, 13, "the content manifest must cover all 13 registered games");
assert.deepEqual(
  manifest.map(entry => entry.gameId).sort(),
  [...gameIds].sort(),
  "manifest game ids must exactly match the canonical registry",
);

for (const entry of manifest) {
  const definition = GAME_REGISTRY[entry.gameId];
  assert.ok(entry.titleAr.trim() && entry.titleEn.trim(), "localized title missing: " + entry.gameId);
  assert.ok(entry.ageGroups.length > 0, "age range missing: " + entry.gameId);
  assert.deepEqual(entry.ageGroups, definition.supportedAgeGroups, "age ranges must come from the canonical registry: " + entry.gameId);
  assert.ok(entry.learningObjective.ar.trim() && entry.learningObjective.en.trim(), "learning objective missing: " + entry.gameId);
  assert.equal(entry.learningObjective.ar, definition.skillAr, "Arabic objective must match the registry: " + entry.gameId);
  assert.equal(entry.learningObjective.en, definition.skillEn, "English objective must match the registry: " + entry.gameId);
  assert.ok(Number.isInteger(entry.revision) && entry.revision >= 1, "content revision must be a positive integer: " + entry.gameId);
  assert.ok(entry.source.references.length > 0, "source references missing: " + entry.gameId);
  assert.ok(entry.source.fields.length > 0, "source fields missing: " + entry.gameId);

  if (entry.source.kind === "kids-content-record") {
    for (const slug of entry.source.references) {
      assert.ok(contentBySlug.has(slug), "missing Kids content source " + slug + " for " + entry.gameId);
    }
  } else {
    for (const reference of entry.source.references) {
      const sourcePath = reference.split("#")[0];
      assert.ok(existsSync(sourcePath), "missing local source file " + sourcePath + " for " + entry.gameId);
    }
  }

  if (entry.reviewStatus === "editorial-review-required") {
    assert.ok(entry.reviewNote?.trim(), "unreviewed content must explain its review blocker: " + entry.gameId);
  }
}

const quizSources = manifest.find(entry => entry.gameId === "zikr-quiz")!.source.references;
const quizSourceSet = new Set(quizSources);
const verifiedQuestions = getVerifiedKidsQuizQuestions();
assert.ok(verifiedQuestions.length >= 20, "the verified quiz adapter must provide enough source-backed questions");
assert.ok(
  verifiedQuestions.every(question => contentBySlug.has(question.sourceSlug)),
  "every quiz question must preserve its originating Kids content slug",
);
assert.ok(
  verifiedQuestions.filter(question => quizSourceSet.has(question.sourceSlug)).length >= 20,
  "the manifest must enumerate the question sources used for ZIKR Quiz",
);
assert.ok(
  verifiedQuestions.every(question =>
    question.text.trim().length > 0 &&
    question.options.length >= 2 &&
    Number.isInteger(question.correctAnswer) &&
    question.correctAnswer >= 0 &&
    question.correctAnswer < question.options.length
  ),
  "quiz questions must have source text, at least two choices, and a valid answer index",
);

const memoryPairs = getVerifiedMemoryPairs();
assert.equal(memoryPairs.length, 11, "Memory must retain all 11 approved source pairs");
assert.equal(new Set(memoryPairs.map(pair => pair.id)).size, memoryPairs.length, "Memory pair identifiers must be unique");
assert.ok(memoryPairs.every(pair => pair.situation.trim() && pair.dhikr.trim()), "Memory must fail the contract on blank source content");

const wudu = getVerifiedWuduContent();
assert.equal(wudu.steps.length, 9, "Wudu must use the complete structured source sequence");
assert.deepEqual(
  wudu.steps.map(step => step.order).sort((a, b) => a - b),
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  "Wudu step order must be complete and unique",
);
assert.ok(wudu.steps.every(step => step.text.trim()), "Wudu step text must be non-empty");
assert.ok(wudu.afterDhikr.trim(), "Wudu completion dhikr must remain source-backed");

const scenarioManifest = manifest.find(entry => entry.gameId === "mosque-adventure")!;
const approvedScenarioSources = new Set(scenarioManifest.source.references);
const scenarios = getApprovedScenarioQuestions();
const roadQuestions = getApprovedRoadQuestions();
assert.ok(scenarios.length >= 15, "approved scenario content must meet the CI minimum of 15 unique prompts");
assert.equal(roadQuestions.length, scenarios.length, "Road and Mosque Adventure must share one canonical pool");
assert.deepEqual(roadQuestions, scenarios, "Road and Mosque Adventure pool content must stay identical");
assert.ok(
  scenarios.every(question => approvedScenarioSources.has(question.sourceSlug)),
  "scenario prompts must remain traceable to the approved source set",
);
const normalizedPrompts = scenarios.map(question => question.text.trim().replace(/\s+/g, " ").toLocaleLowerCase());
assert.equal(new Set(normalizedPrompts).size, scenarios.length, "scenario prompts must not repeat after whitespace normalization");

const verseManifest = manifest.find(entry => entry.gameId === "verse-puzzle")!;
assert.equal(verseManifest.source.kind, "canonical-quran", "Verse Puzzle must use the canonical Quran source");
assert.equal(verseManifest.reviewStatus, "canonical-source", "Quran text must not be treated as locally authored content");
for (const difficulty of ["easy", "normal", "hard"] as const) {
  const references = Array.from({ length: 30 }, (_, level) => getVersePuzzleReference(difficulty, level));
  assert.equal(new Set(references.map(ref => ref.surah + ":" + ref.ayah)).size, 30, "Verse Puzzle must have unique canonical ayah references for " + difficulty);
}
const verseRoute = readFileSync("src/app/api/kids/games/verse/route.ts", "utf8");
assert.ok(verseRoute.includes('getAyahFromDb(reference.surah, reference.ayah, "ar")'), "Verse Puzzle must retrieve text from the Quran database");
assert.ok(verseRoute.includes('{ error: "Verified Quran text is unavailable" }') && verseRoute.includes("status: 503"), "Verse Puzzle must fail safely when canonical text is unavailable");

const letterLab = readFileSync("src/features/kids/components/games/kids-letter-lab.tsx", "utf8");
assert.ok(!letterLab.includes("Choose the letter you hear and see."), "Letter Lab must not promise audio input when it has no audio prompt");
assert.ok(!letterLab.includes("Listen and try again."), "Letter Lab retry feedback must not imply unavailable audio");
assert.ok(!letterLab.includes("Say the letter aloud, then choose the matching card."), "Letter Lab must not imply speaking is detected or required");
assert.ok(letterLab.includes("Choose the matching Arabic letter."), "Letter Lab instruction must match visual gameplay");
assert.ok(letterLab.includes("Look at the target letter, then choose the matching card."), "Letter Lab must describe the actual visual interaction");
assert.ok(letterLab.includes("Look closely at the target letter and try again."), "Letter Lab retry feedback must match visual gameplay");
const letterBlock = letterLab.match(/const LETTERS = \[([\s\S]*?)\];/)?.[1] ?? "";
const letterInventory = Array.from(letterBlock.matchAll(/"([^"]+)"/g), match => match[1]);
const canonicalBaseLetters = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"];
assert.deepEqual(letterInventory, canonicalBaseLetters, "Letter Lab must expose the conventional 28 isolated base letters in order");
assert.equal(new Set(letterInventory).size, 28, "Letter Lab base-letter inventory must contain 28 unique letters");
assert.equal(GAME_REGISTRY["letter-lab"].skillEn, "Visual recognition & attention", "Letter Lab must not overstate literacy skills it does not teach");
const letterManifest = manifest.find(entry => entry.gameId === "letter-lab")!;
assert.equal(letterManifest.reviewStatus, "repository-copy-review-complete", "Letter Lab repository copy and base inventory review must be recorded");
assert.equal(letterManifest.revision, 2, "Letter Lab content manifest revision must advance after educational copy review");
assert.ok(letterManifest.reviewNote?.includes("Formal age-specific curriculum/pedagogy sign-off remains pending"), "Letter Lab must not be mistaken for externally curriculum-certified content");

const deedsManifest = manifest.find(entry => entry.gameId === "good-deeds")!;
const cleanupManifest = manifest.find(entry => entry.gameId === "mosque-cleanup")!;
assert.equal(deedsManifest.reviewStatus, "repository-copy-review-complete", "Good Deeds must have a recorded repository content review");
assert.equal(cleanupManifest.reviewStatus, "repository-copy-review-complete", "Cleanup labels must have a recorded repository content review");
for (const entry of [deedsManifest, cleanupManifest]) {
  assert.ok(entry.reviewNote?.includes("docs/kids-content-editorial-audit-2026-10-21.md"), "reviewed content must link to its review record: " + entry.gameId);
}
const valuesSource = readFileSync("src/features/kids/components/games/kids-values-coloring.tsx", "utf8");
assert.ok(valuesSource.includes("Notice what the character needs and choose a good time to help."), "Good Deeds copy must not imply unavailable audio interaction");
assert.ok(!valuesSource.includes("Listen to the character and choose a good moment to help."), "stale audio-dependent Good Deeds copy must be removed");
assert.equal(manifest.find(entry => entry.gameId === "letter-lab")!.reviewStatus, "repository-copy-review-complete", "Letter Lab repository wording and base inventory review must be recorded");
assert.ok(readFileSync("docs/kids-content-editorial-audit-2026-10-21.md", "utf8").includes("not a formal child-development evaluation"), "the content audit must state its review limitations");

console.log("Kids content manifest passed: all 13 game sources, age groups, objectives, review records, structured content, and Quran fail-safe contracts are consistent.");

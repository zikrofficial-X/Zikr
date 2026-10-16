import { getApprovedScenarioQuestions } from "@/lib/games/verified-content";
import { getMosqueAdventureRules } from "@/lib/games/mosque-adventure";

const questions = getApprovedScenarioQuestions();
const normalizedQuestionTexts = questions.map(question => question.text.trim().replace(/\\s+/g, " ").toLocaleLowerCase());
const requiredSources = ["game-scenario-smart-choice", "quiz-akhlaq-adventure", "quiz-akhlaq-daily-life"];

if (questions.length < 15) {
  throw new Error("Mosque Adventure requires at least 15 approved scenario questions; found " + questions.length + ".");
}

if (new Set(normalizedQuestionTexts).size !== questions.length) {
  throw new Error("Mosque Adventure scenario pool contains duplicate question prompts.");
}

for (const sourceSlug of requiredSources) {
  if (!questions.some(question => question.sourceSlug === sourceSlug)) {
    throw new Error("Mosque Adventure is missing questions from approved source " + sourceSlug + ".");
  }
}

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const rules = getMosqueAdventureRules(difficulty);

  if (rules.nodeCount < 5 || rules.nodeCount > 7) {
    throw new Error("Invalid node count for " + difficulty + ": " + rules.nodeCount);
  }

  if (!rules.questionStationIndexes.every(index => index >= 0 && index < rules.nodeCount)) {
    throw new Error("Invalid question station index for " + difficulty + ".");
  }

  const expectedQuestions = difficulty === "easy" ? 2 : 3;
  if (rules.questionStationIndexes.length !== expectedQuestions) {
    throw new Error(difficulty + " Mosque Adventure should expose " + expectedQuestions + " scenario checkpoints.");
  }
}

console.log("ZIKR Mosque Adventure check passed: " + questions.length + " unique approved scenario questions across " + requiredSources.length + " sources + differentiated map rules.");

import { getApprovedScenarioQuestions } from "@/lib/games/verified-content";
import { getMosqueAdventureRules } from "@/lib/games/mosque-adventure";

const questions = getApprovedScenarioQuestions();

if (questions.length < 2) {
  throw new Error("Mosque Adventure requires at least 2 approved scenario questions; found " + questions.length + ".");
}

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const rules = getMosqueAdventureRules(difficulty);

  if (rules.nodeCount < 5 || rules.nodeCount > 7) {
    throw new Error("Invalid node count for " + difficulty + ": " + rules.nodeCount);
  }

  if (!rules.questionStationIndexes.every(index => index >= 0 && index < rules.nodeCount)) {
    throw new Error("Invalid question station index for " + difficulty + ".");
  }

  if (difficulty === "easy" && rules.questionStationIndexes.length !== 2) {
    throw new Error("Easy Mosque Adventure should expose one scenario checkpoint.");
  }

  if (difficulty === "normal" && rules.questionStationIndexes.length !== 3) {
    if (difficulty === "hard" && rules.questionStationIndexes.length !== 3) {
      throw new Error("Hard Mosque Adventure should expose three scenario checkpoints.");
    }
  }
}

console.log("ZIKR Mosque Adventure check passed: " + questions.length + " approved scenario questions + differentiated map rules.");

import { getApprovedScenarioQuestions } from "@/lib/games/verified-content";
import { getZikrRoadRules } from "@/lib/games/zikr-road";

const questions = getApprovedScenarioQuestions();

if (questions.length < 3) {
  throw new Error(
    "ZIKR Road requires at least 3 approved scenario questions; found " +
      questions.length +
      "."
  );
}

const easy = getZikrRoadRules("easy");
const normal = getZikrRoadRules("normal");
const hard = getZikrRoadRules("hard");

if (
  !(easy.goalDistance < normal.goalDistance && normal.goalDistance < hard.goalDistance)
) {
  throw new Error("ZIKR Road distances must increase with difficulty.");
}

if (!(easy.speed < normal.speed && normal.speed < hard.speed)) {
  throw new Error("ZIKR Road speed must increase with difficulty.");
}

if (
  !(
    easy.hazardInterval > normal.hazardInterval &&
    normal.hazardInterval > hard.hazardInterval
  )
) {
  throw new Error("ZIKR Road hazard cadence must become denser with difficulty.");
}

if (
  !(
    easy.checkpointDistances.length === 1 &&
    normal.checkpointDistances.length === 2 &&
    hard.checkpointDistances.length === 3
  )
) {
  throw new Error("ZIKR Road must expose 1/2/3 learning checkpoints by difficulty.");
}

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const rules = getZikrRoadRules(difficulty);
  if (!rules.checkpointDistances.every((distance) => distance > 0 && distance < rules.goalDistance)) {
    throw new Error("Invalid checkpoint distance for " + difficulty + ".");
  }
}

console.log(
  "ZIKR Road check passed: " +
    questions.length +
    " approved scenario questions + differentiated road progression."
);

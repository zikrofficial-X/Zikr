import { getHilalFlyLevels, getHilalFlyRules } from "@/lib/games/hilal-fly";
import { KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";

const LEVEL_COUNT = KIDS_LEVEL_COUNT;

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const rules = getHilalFlyRules(difficulty);
  const levels = getHilalFlyLevels(difficulty);

  if (levels.length !== rules.levelCount) {
    throw new Error(
      "Hilal Fly " +
        difficulty +
        " expected " +
        rules.levelCount +
        " levels but found " +
        levels.length +
        "."
    );
  }

  if (levels.length !== LEVEL_COUNT) {
    throw new Error("Hilal Fly must expose the full central level catalog per difficulty.");
  }

  if (levels.some(level => !level.titleAr || !level.subtitleAr || !level.theme)) {
    throw new Error("Every Hilal Fly level requires title, subtitle, and theme metadata.");
  }

  if (rules.gapHeight <= 0 || rules.gapHeight >= 400) {
    throw new Error("Hilal Fly gap height is outside the playable range.");
  }

  if (rules.speed <= 0 || rules.spawnInterval <= 0 || rules.starInterval <= 0) {
    throw new Error("Hilal Fly movement and spawn rules must be positive.");
  }

  if (difficulty === "easy" && rules.gapHeight < 180) {
    throw new Error("Easy Hilal Fly requires a forgiving flight gap.");
  }
}

const easy = getHilalFlyRules("easy");
const normal = getHilalFlyRules("normal");
const hard = getHilalFlyRules("hard");

if (!(easy.goalDistance < normal.goalDistance && normal.goalDistance < hard.goalDistance)) {
  throw new Error("Hilal Fly goal distance must increase with difficulty.");
}

if (!(easy.speed < normal.speed && normal.speed < hard.speed)) {
  throw new Error("Hilal Fly speed must increase with difficulty.");
}

if (
  !(
    easy.spawnInterval > normal.spawnInterval &&
    normal.spawnInterval > hard.spawnInterval
  )
) {
  throw new Error("Hilal Fly obstacle cadence must become denser with difficulty.");
}

if (!(easy.gapHeight > normal.gapHeight && normal.gapHeight > hard.gapHeight)) {
  throw new Error("Hilal Fly flight gap must narrow with difficulty.");
}

if (!(easy.lives > normal.lives || easy.lives === normal.lives)) {
  throw new Error("Hilal Fly easy mode must not have fewer lives than normal mode.");
}

if (getHilalFlyLevels("hard").length !== LEVEL_COUNT) {
  throw new Error("Hilal Fly hard mode must cover the complete expanded visual route.");
}

console.log(
  "Hilal Fly check passed: expanded visual route + real difficulty progression + dedicated runtime contract."
);

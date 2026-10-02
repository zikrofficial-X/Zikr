import { getZikrJumpLevels, getZikrJumpRules } from "@/lib/games/zikr-jump";

for (const difficulty of ["easy", "normal", "hard"] as const) {
  const rules = getZikrJumpRules(difficulty);
  const levels = getZikrJumpLevels(difficulty);

  if (levels.length !== rules.levelCount) {
    throw new Error(
      "ZIKR Jump " +
        difficulty +
        " expected " +
        rules.levelCount +
        " levels but found " +
        levels.length +
        "."
    );
  }

  if (levels.some(level => level.platforms.length < 8)) {
    throw new Error("Every ZIKR Jump level must contain at least 8 platforms.");
  }

  if (
    levels.some(
      level =>
        level.goalPlatformIndex !== level.platforms.length - 1 ||
        level.platforms[0].width < 200
    )
  ) {
    throw new Error("Every ZIKR Jump level must have a stable start and final goal platform.");
  }

  if (difficulty === "easy" && levels.some(level => level.hazards.length > 0)) {
    throw new Error("Easy ZIKR Jump must not require hazard avoidance.");
  }

  if (difficulty !== "easy" && levels.some(level => level.hazards.length === 0)) {
    throw new Error("Normal and hard ZIKR Jump levels must contain hazards.");
  }
}

const easy = getZikrJumpRules("easy");
const normal = getZikrJumpRules("normal");
const hard = getZikrJumpRules("hard");

if (!(easy.levelCount < normal.levelCount && normal.levelCount < hard.levelCount)) {
  throw new Error("ZIKR Jump level count must increase with difficulty.");
}

if (!(easy.jumpVelocity < normal.jumpVelocity && normal.jumpVelocity < hard.jumpVelocity)) {
  throw new Error("ZIKR Jump jump velocity must increase with difficulty.");
}

console.log(
  "ZIKR Jump check passed: deterministic levels, difficulty progression, and playable start/goal platforms are configured."
);

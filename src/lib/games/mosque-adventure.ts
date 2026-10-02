import type { GameDifficulty } from "@/lib/games/registry";
import { KIDS_LEVEL_COUNT, getKidsLevelMeta } from "@/lib/games/kids-level-system";

export type MosqueAdventureRules = {
  levelCount: number;
  nodeCount: number;
  questionStationIndexes: number[];
  mistakePenalty: number;
};

export function getMosqueAdventureRules(difficulty: GameDifficulty): MosqueAdventureRules {
  return {
    levelCount: KIDS_LEVEL_COUNT,
    nodeCount: 5 + (difficulty === "hard" ? 2 : difficulty === "normal" ? 1 : 0),
    questionStationIndexes: [1, 3, 5].filter(index => index < 5 + (difficulty === "hard" ? 2 : difficulty === "normal" ? 1 : 0)),
    mistakePenalty: difficulty === "hard" ? 70 : difficulty === "normal" ? 35 : 0,
  };
}

export function getMosqueAdventureLevel(difficulty: GameDifficulty, index: number) {
  return getKidsLevelMeta("mosque-adventure", difficulty, index);
}

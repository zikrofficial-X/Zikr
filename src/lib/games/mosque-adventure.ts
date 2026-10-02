import type { GameDifficulty } from "@/lib/games/registry";

export type MosqueAdventureRules = {
  level: 1 | 2 | 3;
  nodeCount: number;
  questionStationIndexes: number[];
  mistakePenalty: number;
};

const RULES: Record<GameDifficulty, MosqueAdventureRules> = {
  easy: {
    level: 1,
    nodeCount: 3,
    questionStationIndexes: [1],
    mistakePenalty: 0,
  },
  normal: {
    level: 2,
    nodeCount: 4,
    questionStationIndexes: [1, 3],
    mistakePenalty: 35,
  },
  hard: {
    level: 3,
    nodeCount: 5,
    questionStationIndexes: [1, 3],
    mistakePenalty: 70,
  },
};

export function getMosqueAdventureRules(difficulty: GameDifficulty): MosqueAdventureRules {
  return RULES[difficulty];
}

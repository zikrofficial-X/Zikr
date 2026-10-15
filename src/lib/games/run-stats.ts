export type GameRunTotals = {
  score: number;
  collectibles: number;
  bestCombo: number;
};

export type GameLevelTotals = {
  score: number;
  collectibles: number;
  combo: number;
};

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function createGameRunTotals(): GameRunTotals {
  return { score: 0, collectibles: 0, bestCombo: 0 };
}

/** Adds a completed level to the current round without accepting invalid numeric values. */
export function accumulateGameLevel(
  previous: GameRunTotals,
  level: GameLevelTotals,
): GameRunTotals {
  return {
    score: Math.min(Number.MAX_SAFE_INTEGER, nonNegativeInteger(previous.score) + nonNegativeInteger(level.score)),
    collectibles: Math.min(Number.MAX_SAFE_INTEGER, nonNegativeInteger(previous.collectibles) + nonNegativeInteger(level.collectibles)),
    bestCombo: Math.max(nonNegativeInteger(previous.bestCombo), nonNegativeInteger(level.combo)),
  };
}

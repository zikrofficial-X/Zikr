export type GameResult = {
  gameId: string;
  score: number;
  collectibles: number;
  duration: number;
  success: boolean;
};

export type GameRunnerConfig = {
  gameId: string;
  onScore?: (score: number) => void;
  onGameOver?: (result: GameResult) => void;
};

/**
 * Universal game runner for all kids games
 * Handles game lifecycle, scoring, and persistence
 */
export class GameRunner {
  private startTime: number = 0;
  private currentScore: number = 0;
  private currentCollectibles: number = 0;
  private gameActive: boolean = false;

  constructor(private config: GameRunnerConfig) {}

  start() {
    this.startTime = Date.now();
    this.gameActive = true;
    this.currentScore = 0;
    this.currentCollectibles = 0;
  }

  addScore(points: number) {
    this.currentScore += points;
    this.config.onScore?.(this.currentScore);
  }

  addCollectible(count: number = 1) {
    this.currentCollectibles += count;
  }

  finish(success: boolean = true) {
    this.gameActive = false;

    const duration = Math.floor((Date.now() - this.startTime) / 1000);

    const result: GameResult = {
      gameId: this.config.gameId,
      score: this.currentScore,
      collectibles: this.currentCollectibles,
      duration,
      success,
    };

    this.config.onGameOver?.(result);
    return result;
  }

  isActive(): boolean {
    return this.gameActive;
  }

  getScore(): number {
    return this.currentScore;
  }

  getCollectibles(): number {
    return this.currentCollectibles;
  }

  getDuration(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

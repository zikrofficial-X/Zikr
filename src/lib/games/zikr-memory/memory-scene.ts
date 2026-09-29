// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type MemoryHud = {
  score: number;
  collectibles: number;
  moves: number;
  pairs: number;
};

export type MemorySceneCallbacks = {
  onReady: (scene: ZikrMemoryScene) => void;
  onHud: (hud: MemoryHud) => void;
  onGameOver: (hud: MemoryHud) => void;
};

type MemoryData = {
  callbacks: MemorySceneCallbacks;
};

type MemoryCard = {
  id: number;
  pairId: number;
  isFlipped: boolean;
  isMatched: boolean;
};

const COLORS = {
  background: 0x071b24,
  card: 0x23606a,
  cardHover: 0x2f8a9e,
  cardFlipped: 0xf3c969,
  gold: 0xf3c969,
  cream: 0xfff7dc,
  success: 0x5fd1a6,
};

const CARD_PAIRS = [
  { symbol: "🌙", name: "moon" },
  { symbol: "⭐", name: "star" },
  { symbol: "☀️", name: "sun" },
  { symbol: "❤️", name: "heart" },
  { symbol: "🕌", name: "mosque" },
  { symbol: "📖", name: "quran" },
  { symbol: "🌳", name: "tree" },
  { symbol: "🌸", name: "flower" },
];

export class ZikrMemoryScene extends Phaser.Scene {
  private callbacks!: MemorySceneCallbacks;
  private readonly tone = new ToneFeedback("learning");
  private cards: MemoryCard[] = [];
  private cardObjects: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  private cardSymbols: Map<number, Phaser.GameObjects.Text> = new Map();
  private score = 0;
  private collectibles = 0;
  private moves = 0;
  private pairs = 0;
  private flippedCards: number[] = [];
  private canFlip = true;
  private readonly gridCols = 4;
  private readonly gridRows = 4;
  private readonly cardSize = 60;
  private readonly spacing = 20;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrMemoryScene" });
  }

  init(data: MemoryData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets needed for this simple game
  }

  create() {
    this.initializeCards();
    this.drawCards();
    this.callbacks.onReady(this);
  }

  update() {
    // Update HUD on card flip
    if (this.flippedCards.length > 0) {
      this.updateHud();
    }
  }

  private initializeCards() {
    this.cards = [];
    for (let i = 0; i < CARD_PAIRS.length; i++) {
      this.cards.push({
        id: i * 2,
        pairId: i,
        isFlipped: false,
        isMatched: false,
      });
      this.cards.push({
        id: i * 2 + 1,
        pairId: i,
        isFlipped: false,
        isMatched: false,
      });
    }
    // Shuffle cards
    this.cards.sort(() => Math.random() - 0.5);
  }

  private drawCards() {
    const startX = (800 - (this.gridCols * this.cardSize + (this.gridCols - 1) * this.spacing)) / 2;
    const startY = 100;

    this.cards.forEach((card, index) => {
      const row = Math.floor(index / this.gridCols);
      const col = index % this.gridCols;
      const x = startX + col * (this.cardSize + this.spacing);
      const y = startY + row * (this.cardSize + this.spacing);

      // Card background
      const cardRect = this.add
        .rectangle(x, y, this.cardSize, this.cardSize, COLORS.card)
        .setStrokeStyle(2, COLORS.gold)
        .setInteractive()
        .on("pointerdown", () => this.flipCard(card.id));

      this.cardObjects.set(card.id, cardRect);

      // Card symbol (hidden initially)
      const symbol = this.add
        .text(x, y, CARD_PAIRS[card.pairId].symbol, {
          fontSize: "32px",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setAlpha(0); // Hidden initially

      this.cardSymbols.set(card.id, symbol);
    });
  }

  private flipCard(cardId: number) {
    if (!this.canFlip) return;
    if (this.flippedCards.includes(cardId)) return;

    const card = this.cards.find((c) => c.id === cardId);
    if (!card || card.isMatched) return;

    card.isFlipped = true;
    this.flippedCards.push(cardId);
    this.moves++;

    const cardObj = this.cardObjects.get(cardId);
    const symbolObj = this.cardSymbols.get(cardId);

    if (cardObj && symbolObj) {
      cardObj.setFillStyle(COLORS.cardFlipped);
      symbolObj.setAlpha(1);
      this.tone.play("success");
    }

    if (this.flippedCards.length === 2) {
      this.canFlip = false;
      this.time.delayedCall(600, () => this.checkMatch());
    }

    this.updateHud();
  }

  private checkMatch() {
    const [id1, id2] = this.flippedCards;
    const card1 = this.cards.find((c) => c.id === id1);
    const card2 = this.cards.find((c) => c.id === id2);

    if (card1 && card2 && card1.pairId === card2.pairId) {
      // Match found!
      card1.isMatched = true;
      card2.isMatched = true;
      this.pairs++;
      this.collectibles += 10;
      this.score += 100;
      this.tone.play("victory");

      if (this.pairs === CARD_PAIRS.length) {
        this.gameOver();
      }
    } else {
      // No match, flip back
      for (const cardId of this.flippedCards) {
        const card = this.cards.find((c) => c.id === cardId);
        const cardObj = this.cardObjects.get(cardId);
        const symbolObj = this.cardSymbols.get(cardId);

        if (card && cardObj && symbolObj) {
          card.isFlipped = false;
          cardObj.setFillStyle(COLORS.card);
          symbolObj.setAlpha(0);
        }
      }
    }

    this.flippedCards = [];
    this.canFlip = true;
    this.updateHud();
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectibles,
      moves: this.moves,
      pairs: this.pairs,
    });
  }

  private gameOver() {
    this.canFlip = false;
    this.tone.play("victory");
    this.time.delayedCall(500, () => {
      this.callbacks.onGameOver({
        score: this.score,
        collectibles: this.collectibles,
        moves: this.moves,
        pairs: this.pairs,
      });
    });
  }
}

// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type VerseHud = {
  score: number;
  collectibles: number;
  verses: number;
};

export type VerseSceneCallbacks = {
  onReady: (scene: ZikrVerseScene) => void;
  onHud: (hud: VerseHud) => void;
  onGameOver: (hud: VerseHud) => void;
};

type VerseData = {
  callbacks: VerseSceneCallbacks;
};

type VerseWord = {
  id: number;
  text: string;
  correctIndex: number;
  currentIndex: number;
};

const COLORS = {
  background: 0x071b24,
  word: 0x23606a,
  wordHover: 0x2f8a9e,
  correct: 0x5fd1a6,
  gold: 0xf3c969,
  cream: 0xfff7dc,
};

const VERSES = [
  {
    words: ["الحمد", "لله", "رب", "العالمين"],
    translation: "All praise is due to Allah, Lord of the worlds",
  },
  {
    words: ["بسم", "الله", "الرحمن", "الرحيم"],
    translation: "In the name of Allah, the Most Gracious, the Most Merciful",
  },
  {
    words: ["لا", "إله", "إلا", "الله"],
    translation: "There is no god except Allah",
  },
];

export class ZikrVerseScene extends Phaser.Scene {
  private callbacks!: VerseSceneCallbacks;
  private readonly tone = new ToneFeedback("learning");
  private words: VerseWord[] = [];
  private wordObjects: Map<number, Phaser.GameObjects.Container> = new Map();
  private score = 0;
  private collectibles = 0;
  private verses = 0;
  private currentVerseIndex = 0;
  private draggedWord: VerseWord | null = null;
  private readonly wordWidth = 80;
  private readonly wordHeight = 40;
  private readonly spacing = 100;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrVerseScene" });
  }

  init(data: VerseData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets needed
  }

  create() {
    this.loadVerse(0);
    this.drawVerse();
    this.callbacks.onReady(this);
  }

  update() {
    // Update if needed
  }

  private loadVerse(index: number) {
    const verse = VERSES[index];
    this.words = verse.words.map((word, i) => ({
      id: i,
      text: word,
      correctIndex: i,
      currentIndex: i,
    }));

    // Shuffle words
    this.words.sort(() => Math.random() - 0.5);
    this.words.forEach((word, i) => {
      word.currentIndex = i;
    });
  }

  private drawVerse() {
    this.wordObjects.clear();

    const startX = 50;
    const startY = 150;

    // Instructions
    this.add.text(400, 50, "رتب كلمات الآية", {
      fontSize: "18px",
      fontStyle: "bold",
      color: COLORS.gold,
    }).setOrigin(0.5);

    // Words to arrange
    this.words.forEach((word, index) => {
      const x = startX + index * this.spacing;
      const y = startY;

      const container = this.add.container(x, y);

      const bg = this.add
        .rectangle(0, 0, this.wordWidth, this.wordHeight, COLORS.word)
        .setStrokeStyle(2, COLORS.gold);

      const text = this.add
        .text(0, 0, word.text, {
          fontSize: "14px",
          fontStyle: "bold",
          color: COLORS.cream,
        })
        .setOrigin(0.5);

      container.add([bg, text]);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-this.wordWidth / 2, -this.wordHeight / 2, this.wordWidth, this.wordHeight),
        Phaser.Geom.Rectangle.Contains
      );

      container.on("pointerdown", () => this.startDrag(word, container));
      container.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        if (word === this.draggedWord) {
          container.x = pointer.x;
        }
      });

      container.on("pointerup", () => this.endDrag(word, container));

      this.wordObjects.set(word.id, container);
    });

    // Drop zones
    for (let i = 0; i < this.words.length; i++) {
      const x = startX + i * this.spacing;
      const y = startY + 100;

      this.add
        .rectangle(x, y, this.wordWidth, this.wordHeight)
        .setStrokeStyle(2, COLORS.gold)
        .setFillStyle(COLORS.background)
        .setAlpha(0.5);
    }
  }

  private startDrag(word: VerseWord, container: Phaser.GameObjects.Container) {
    this.draggedWord = word;
    container.setDepth(100);
    this.tone.play("success");
  }

  private endDrag(word: VerseWord, container: Phaser.GameObjects.Container) {
    this.draggedWord = null;
    container.setDepth(0);

    const startX = 50;
    const dropZoneY = 150 + 100;

    if (Phaser.Math.Distance.Between(container.x, container.y, startX + word.correctIndex * this.spacing, dropZoneY) < 50) {
      // Correct position!
      if (word.currentIndex !== word.correctIndex) {
        container.y = dropZoneY;
        word.currentIndex = word.correctIndex;
        this.score += 100;
        this.collectibles += 10;

        // Check if all words are in correct positions
        if (this.words.every((w) => w.currentIndex === w.correctIndex)) {
          this.completeVerse();
        }
      }
    } else {
      // Animate back
      this.tweens.add({
        targets: container,
        x: startX + word.currentIndex * this.spacing,
        y: 150,
        duration: 300,
        ease: "Quad.easeOut",
      });
    }

    this.updateHud();
  }

  private completeVerse() {
    this.verses++;
    this.tone.play("victory");
    this.score += 200;
    this.collectibles += 20;

    this.time.delayedCall(1500, () => {
      if (this.currentVerseIndex < VERSES.length - 1) {
        this.currentVerseIndex++;
        this.wordObjects.forEach((obj) => obj.destroy());
        this.loadVerse(this.currentVerseIndex);
        this.drawVerse();
      } else {
        this.gameOver();
      }
    });
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectibles,
      verses: this.verses,
    });
  }

  private gameOver() {
    this.callbacks.onGameOver({
      score: this.score,
      collectibles: this.collectibles,
      verses: this.verses,
    });
  }
}

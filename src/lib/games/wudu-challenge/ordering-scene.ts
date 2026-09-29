// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type OrderingHud = {
  score: number;
  collectibles: number;
  correct: number;
};

export type OrderingSceneCallbacks = {
  onReady: (scene: ZikrOrderingScene) => void;
  onHud: (hud: OrderingHud) => void;
  onGameOver: (hud: OrderingHud) => void;
};

type OrderingData = {
  callbacks: OrderingSceneCallbacks;
};

type OrderItem = {
  id: number;
  textAr: string;
  textEn: string;
  correctPosition: number;
  currentPosition: number;
  isDragging: boolean;
};

const COLORS = {
  background: 0x071b24,
  itemBg: 0x23606a,
  itemHover: 0x2f8a9e,
  correct: 0x5fd1a6,
  gold: 0xf3c969,
  cream: 0xfff7dc,
};

const WUDU_STEPS = [
  { ar: "النية والتسمية", en: "Intention and Bismillah" },
  { ar: "غسل الوجه", en: "Wash face" },
  { ar: "غسل الذراعين", en: "Wash forearms" },
  { ar: "المسح على الرأس", en: "Wipe head" },
  { ar: "مسح الأذنين", en: "Wipe ears" },
  { ar: "غسل القدمين", en: "Wash feet" },
];

export class ZikrOrderingScene extends Phaser.Scene {
  private callbacks!: OrderingSceneCallbacks;
  private readonly tone = new ToneFeedback("learning");
  private items: OrderItem[] = [];
  private itemObjects: Map<number, Phaser.GameObjects.Container> = new Map();
  private score = 0;
  private collectibles = 0;
  private correct = 0;
  private draggedItem: OrderItem | null = null;
  private readonly itemWidth = 200;
  private readonly itemHeight = 50;
  private readonly spacing = 70;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrOrderingScene" });
  }

  init(data: OrderingData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets needed
  }

  create() {
    this.initializeItems();
    this.drawItems();
    this.drawDropZones();
    this.callbacks.onReady(this);
  }

  update() {
    // Update HUD if needed
  }

  private initializeItems() {
    this.items = WUDU_STEPS.map((step, index) => ({
      id: index,
      textAr: step.ar,
      textEn: step.en,
      correctPosition: index,
      currentPosition: index,
      isDragging: false,
    }));

    // Shuffle items
    this.items.sort(() => Math.random() - 0.5);
    this.items.forEach((item, i) => {
      item.currentPosition = i;
    });
  }

  private drawItems() {
    const startX = 50;
    const startY = 150;

    this.items.forEach((item, index) => {
      const y = startY + index * this.spacing;

      const container = this.add.container(startX, y);

      const bg = this.add
        .rectangle(0, 0, this.itemWidth, this.itemHeight, COLORS.itemBg)
        .setStrokeStyle(2, COLORS.gold);

      const text = this.add
        .text(0, -5, `${index + 1}. ${item.textAr}`, {
          fontSize: "14px",
          fontStyle: "bold",
          color: COLORS.cream,
        })
        .setOrigin(0.5);

      container.add([bg, text]);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-this.itemWidth / 2, -this.itemHeight / 2, this.itemWidth, this.itemHeight),
        Phaser.Geom.Rectangle.Contains
      );

      container.on("pointerdown", () => this.startDrag(item, container));
      container.on("pointermove", (pointer: Phaser.Input.Pointer) => {
        if (item.isDragging) {
          container.y = pointer.y;
        }
      });

      container.on("pointerup", () => this.endDrag(item, container));

      this.itemObjects.set(item.id, container);
    });
  }

  private drawDropZones() {
    const startX = 350;
    const startY = 150;

    for (let i = 0; i < WUDU_STEPS.length; i++) {
      const y = startY + i * this.spacing;

      const zoneLabel = this.add
        .text(startX + 30, y - 30, `الخطوة ${i + 1}`, {
          fontSize: "12px",
          color: COLORS.gold,
        })
        .setOrigin(0.5);

      this.add
        .rectangle(startX + 30, y, 150, this.itemHeight)
        .setStrokeStyle(2, COLORS.gold)
        .setFillStyle(COLORS.background);
    }
  }

  private startDrag(item: OrderItem, container: Phaser.GameObjects.Container) {
    item.isDragging = true;
    container.setDepth(100);
    this.tone.play("success");
  }

  private endDrag(item: OrderItem, container: Phaser.GameObjects.Container) {
    item.isDragging = false;
    container.setDepth(0);

    // Check if item is in correct position
    const dropZoneX = 350 + 30;
    const dropZoneY = 150 + item.correctPosition * this.spacing;

    if (Phaser.Math.Distance.Between(container.x, container.y, dropZoneX, dropZoneY) < 60) {
      // Correct position!
      if (item.currentPosition !== item.correctPosition) {
        container.y = dropZoneY;
        item.currentPosition = item.correctPosition;
        this.score += 50;
        this.collectibles += 5;
        this.correct++;
        this.tone.play("victory");

        if (this.correct === WUDU_STEPS.length) {
          this.gameOver();
        }
      }
    } else {
      // Wrong position, animate back
      this.tweens.add({
        targets: container,
        y: 150 + item.currentPosition * this.spacing,
        duration: 300,
        ease: "Quad.easeOut",
      });
    }

    this.updateHud();
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectibles,
      correct: this.correct,
    });
  }

  private gameOver() {
    this.tone.play("victory");
    this.time.delayedCall(500, () => {
      this.callbacks.onGameOver({
        score: this.score,
        collectibles: this.collectibles,
        correct: this.correct,
      });
    });
  }
}

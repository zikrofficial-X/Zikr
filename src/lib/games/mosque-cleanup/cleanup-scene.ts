// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type CleanupHud = {
  score: number;
  collectibles: number;
  cleaned: number;
};

export type CleanupSceneCallbacks = {
  onReady: (scene: ZikrCleanupScene) => void;
  onHud: (hud: CleanupHud) => void;
  onGameOver: (hud: CleanupHud) => void;
};

type CleanupData = {
  callbacks: CleanupSceneCallbacks;
};

type Trash = {
  id: number;
  x: number;
  y: number;
  cleaned: boolean;
};

const COLORS = {
  background: 0x071b24,
  trash: 0xe28a5a,
  cleaned: 0x5fd1a6,
  player: 0xf3c969,
};

const TRASH_COUNT = 15;

export class ZikrCleanupScene extends Phaser.Scene {
  private callbacks!: CleanupSceneCallbacks;
  private readonly tone = new ToneFeedback("learning");
  private trash: Trash[] = [];
  private trashObjects: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  private player!: Phaser.GameObjects.Rectangle;
  private score = 0;
  private collectibles = 0;
  private cleaned = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrCleanupScene" });
  }

  init(data: CleanupData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);

    // Create player (brush)
    this.player = this.add.rectangle(400, 300, 30, 30, COLORS.player);

    // Initialize trash
    for (let i = 0; i < TRASH_COUNT; i++) {
      const trash: Trash = {
        id: i,
        x: Phaser.Math.Between(50, 750),
        y: Phaser.Math.Between(50, 550),
        cleaned: false,
      };
      this.trash.push(trash);

      const trashObj = this.add.rectangle(trash.x, trash.y, 20, 20, COLORS.trash);
      this.trashObjects.set(trash.id, trashObj);
    }

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.mouse!.disableContextMenu();

    this.callbacks.onReady(this);
  }

  update() {
    // Player movement
    if (this.cursors.left.isDown) {
      this.player.x = Math.max(15, this.player.x - 5);
    }
    if (this.cursors.right.isDown) {
      this.player.x = Math.min(785, this.player.x + 5);
    }
    if (this.cursors.up.isDown) {
      this.player.y = Math.max(15, this.player.y - 5);
    }
    if (this.cursors.down.isDown) {
      this.player.y = Math.min(585, this.player.y + 5);
    }

    // Check proximity to trash
    this.trash.forEach((trash) => {
      if (!trash.cleaned) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          trash.x,
          trash.y
        );

        if (distance < 50) {
          this.cleanTrash(trash);
        }
      }
    });
  }

  private cleanTrash(trash: Trash) {
    if (trash.cleaned) return;

    trash.cleaned = true;
    this.cleaned++;
    this.score += 100;
    this.collectibles += 10;
    this.tone.play("success");

    const trashObj = this.trashObjects.get(trash.id);
    if (trashObj) {
      trashObj.setFillStyle(COLORS.cleaned);
      this.tweens.add({
        targets: trashObj,
        scale: 0.5,
        alpha: 0.3,
        duration: 300,
      });
    }

    this.updateHud();

    if (this.cleaned === TRASH_COUNT) {
      this.gameOver();
    }
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectibles,
      cleaned: this.cleaned,
    });
  }

  private gameOver() {
    this.tone.play("victory");
    this.time.delayedCall(500, () => {
      this.callbacks.onGameOver({
        score: this.score,
        collectibles: this.collectibles,
        cleaned: this.cleaned,
      });
    });
  }
}

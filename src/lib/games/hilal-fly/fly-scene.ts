// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type FlyHud = {
  score: number;
  collectibles: number;
  distance: number;
};

export type FlySceneCallbacks = {
  onReady: (scene: ZikrFlyScene) => void;
  onHud: (hud: FlyHud) => void;
  onGameOver: (hud: FlyHud) => void;
};

type FlyData = {
  callbacks: FlySceneCallbacks;
};

const COLORS = {
  background: 0x071b24,
  player: 0xf3c969,
  obstacle: 0xe28a5a,
  collectible: 0x5fd1a6,
  gold: 0xf3c969,
};

export class ZikrFlyScene extends Phaser.Scene {
  private callbacks!: FlySceneCallbacks;
  private readonly tone = new ToneFeedback("adventure");
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private collectiblesCount = 0;
  private distance = 0;
  private gameActive = true;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrFlyScene" });
  }

  init(data: FlyData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);

    // Create player
    this.player = this.physics.add.sprite(100, 300, undefined);
    this.player.setBounce(0);
    this.player.setDrag(0);
    this.player.setDamping(true);
    this.player.setDamping(0.99);

    // Create obstacle and collectible groups
    this.obstacles = this.physics.add.group();
    this.collectibles = this.physics.add.group();

    // Spawn obstacles and collectibles
    this.time.addTimer({
      delay: 1000,
      callback: () => this.spawnObstacle(),
      loop: true,
    });

    this.time.addTimer({
      delay: 1500,
      callback: () => this.spawnCollectible(),
      loop: true,
    });

    // Collisions
    this.physics.add.overlap(this.player, this.obstacles, (obj1, obj2) => {
      if (this.gameActive) {
        this.gameActive = false;
        this.gameOver();
      }
    });

    this.physics.add.overlap(this.player, this.collectibles, (obj1, obj2) => {
      (obj2 as Phaser.Physics.Arcade.Image).destroy();
      this.score += 50;
      this.collectiblesCount++;
      this.tone.play("success");
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.callbacks.onReady(this);
  }

  update() {
    if (!this.gameActive) return;

    // Player controls
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-200);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(200);
    } else {
      this.player.setVelocityY(0);
    }

    // Keep player in bounds
    if (this.player.y < 0) this.player.y = 0;
    if (this.player.y > 600) this.player.y = 600;

    // Remove off-screen objects
    this.obstacles.children.entries.forEach((obj: any) => {
      if (obj.x < -50) obj.destroy();
    });

    this.collectibles.children.entries.forEach((obj: any) => {
      if (obj.x < -50) obj.destroy();
    });

    // Increase distance
    this.distance += 1;
    this.score = Math.max(this.score, Math.floor(this.distance / 10));

    this.updateHud();
  }

  private spawnObstacle() {
    const y = Phaser.Math.Between(50, 550);
    const obstacle = this.obstacles.create(800, y, undefined);
    obstacle.setVelocityX(-200);
    obstacle.setScale(0.5);
  }

  private spawnCollectible() {
    const y = Phaser.Math.Between(50, 550);
    const collectible = this.collectibles.create(800, y, undefined);
    collectible.setVelocityX(-150);
    collectible.setTint(0x5fd1a6);
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectiblesCount,
      distance: Math.floor(this.distance),
    });
  }

  private gameOver() {
    this.physics.pause();
    this.tone.play("gameover");
    this.time.delayedCall(500, () => {
      this.callbacks.onGameOver({
        score: this.score,
        collectibles: this.collectiblesCount,
        distance: Math.floor(this.distance),
      });
    });
  }
}

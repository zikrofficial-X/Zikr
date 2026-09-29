// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type RoadHud = {
  score: number;
  collectibles: number;
  distance: number;
};

export type RoadSceneCallbacks = {
  onReady: (scene: ZikrRoadScene) => void;
  onHud: (hud: RoadHud) => void;
  onGameOver: (hud: RoadHud) => void;
};

type RoadData = {
  callbacks: RoadSceneCallbacks;
};

const COLORS = {
  background: 0x071b24,
  player: 0xf3c969,
  vehicle: 0xe28a5a,
  collectible: 0x5fd1a6,
  road: 0x102f3a,
};

export class ZikrRoadScene extends Phaser.Scene {
  private callbacks!: RoadSceneCallbacks;
  private readonly tone = new ToneFeedback("adventure");
  private player!: Phaser.Physics.Arcade.Sprite;
  private vehicles!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private collectiblesCount = 0;
  private distance = 0;
  private gameActive = true;
  private readonly laneCount = 3;
  private readonly laneWidth = 100;
  private currentLane = 1;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrRoadScene" });
  }

  init(data: RoadData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);

    // Draw road
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(100 + i * this.laneWidth + this.laneWidth / 2, 300, this.laneWidth, 600, COLORS.road);
    }

    // Create player
    this.currentLane = 1;
    this.player = this.physics.add.sprite(150 + this.currentLane * this.laneWidth, 500, undefined);
    this.player.setCollideWorldBounds(false);

    // Create vehicle and collectible groups
    this.vehicles = this.physics.add.group();
    this.collectibles = this.physics.add.group();

    // Spawn vehicles
    this.time.addTimer({
      delay: 800,
      callback: () => this.spawnVehicle(),
      loop: true,
    });

    // Spawn collectibles
    this.time.addTimer({
      delay: 2000,
      callback: () => this.spawnCollectible(),
      loop: true,
    });

    // Collisions
    this.physics.add.overlap(this.player, this.vehicles, () => {
      if (this.gameActive) {
        this.gameActive = false;
        this.gameOver();
      }
    });

    this.physics.add.overlap(this.player, this.collectibles, (obj1, obj2) => {
      (obj2 as Phaser.Physics.Arcade.Image).destroy();
      this.score += 100;
      this.collectiblesCount++;
      this.tone.play("success");
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.callbacks.onReady(this);
  }

  update() {
    if (!this.gameActive) return;

    // Player controls - change lanes
    if (this.cursors.left.isDown && this.currentLane > 0) {
      this.currentLane--;
      this.player.x = 150 + this.currentLane * this.laneWidth;
    }

    if (this.cursors.right.isDown && this.currentLane < this.laneCount - 1) {
      this.currentLane++;
      this.player.x = 150 + this.currentLane * this.laneWidth;
    }

    // Remove off-screen vehicles
    this.vehicles.children.entries.forEach((obj: any) => {
      if (obj.y > 600) obj.destroy();
    });

    this.collectibles.children.entries.forEach((obj: any) => {
      if (obj.y > 600) obj.destroy();
    });

    // Increase distance
    this.distance += 1;

    this.updateHud();
  }

  private spawnVehicle() {
    const lane = Phaser.Math.Between(0, this.laneCount - 1);
    const x = 150 + lane * this.laneWidth;
    const vehicle = this.vehicles.create(x, 0, undefined);
    vehicle.setVelocityY(Phaser.Math.Between(150, 250));
    vehicle.setScale(0.8);
  }

  private spawnCollectible() {
    const lane = Phaser.Math.Between(0, this.laneCount - 1);
    const x = 150 + lane * this.laneWidth;
    const collectible = this.collectibles.create(x, -20, undefined);
    collectible.setVelocityY(150);
    collectible.setTint(COLORS.collectible);
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectiblesCount,
      distance: this.distance,
    });
  }

  private gameOver() {
    this.physics.pause();
    this.tone.play("gameover");
    this.time.delayedCall(500, () => {
      this.callbacks.onGameOver({
        score: this.score,
        collectibles: this.collectiblesCount,
        distance: this.distance,
      });
    });
  }
}

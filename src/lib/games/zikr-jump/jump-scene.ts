// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type JumpHud = {
  score: number;
  collectibles: number;
  height: number;
};

export type JumpSceneCallbacks = {
  onReady: (scene: ZikrJumpScene) => void;
  onHud: (hud: JumpHud) => void;
  onGameOver: (hud: JumpHud) => void;
};

type JumpData = {
  callbacks: JumpSceneCallbacks;
};

const COLORS = {
  background: 0x071b24,
  platform: 0x23606a,
  player: 0xf3c969,
  collectible: 0x5fd1a6,
  gold: 0xf3c969,
};

export class ZikrJumpScene extends Phaser.Scene {
  private callbacks!: JumpSceneCallbacks;
  private readonly tone = new ToneFeedback("adventure");
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private collectiblesCount = 0;
  private maxHeight = 0;
  private gameActive = true;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrJumpScene" });
  }

  init(data: JumpData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);
    this.cameras.main.setBounds(0, 0, 800, 600);

    // Create platforms
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.platforms.create(400, 580, undefined);
    if (ground) {
      (ground as any).setScale(2).refreshBody();
    }

    // Add platforms
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = 500 - i * 70;
      const platform = this.platforms.create(x, y, undefined) as Phaser.Physics.Arcade.StaticSprite;
      platform.displayWidth = 100;
      platform.refreshBody();
    }

    // Create player
    this.player = this.physics.add.sprite(400, 450, undefined);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(0.99);

    // Collectibles
    this.collectibles = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      this.collectibles.create(x, y, undefined);
    }

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
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
    // Player controls
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (this.cursors.space.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
      this.tone.play("success");
    }

    // Track height
    const currentHeight = Math.max(0, 580 - this.player.y);
    if (currentHeight > this.maxHeight) {
      this.maxHeight = currentHeight;
    }

    // Fall detection
    if (this.player.y > 600 && this.gameActive) {
      this.gameActive = false;
      this.gameOver();
    }

    this.updateHud();
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectiblesCount,
      height: Math.round(this.maxHeight),
    });
  }

  private gameOver() {
    this.physics.pause();
    this.tone.play("gameover");
    this.time.delayedCall(500, () => {
      this.callbacks.onGameOver({
        score: this.score,
        collectibles: this.collectiblesCount,
        height: this.maxHeight,
      });
    });
  }
}

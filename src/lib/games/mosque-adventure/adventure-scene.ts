// @ts-nocheck - Game implementation with Phaser physics engine
import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type AdventureHud = {
  score: number;
  collectibles: number;
  level: number;
};

export type AdventureSceneCallbacks = {
  onReady: (scene: ZikrAdventureScene) => void;
  onHud: (hud: AdventureHud) => void;
  onGameOver: (hud: AdventureHud) => void;
};

type AdventureData = {
  callbacks: AdventureSceneCallbacks;
};

const COLORS = {
  background: 0x071b24,
  player: 0xf3c969,
  platform: 0x23606a,
  collectible: 0x5fd1a6,
  enemy: 0xe28a5a,
};

export class ZikrAdventureScene extends Phaser.Scene {
  private callbacks!: AdventureSceneCallbacks;
  private readonly tone = new ToneFeedback("adventure");
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private score = 0;
  private collectiblesCount = 0;
  private level = 0;
  private gameActive = true;
  private canJump = false;

  constructor(config: Phaser.Types.Scenes.SettingsConfig = {}) {
    super({ ...config, key: "ZikrAdventureScene" });
  }

  init(data: AdventureData) {
    this.callbacks = data.callbacks;
  }

  preload() {
    // No external assets
  }

  create() {
    this.physics.world.setBounds(0, 0, 1600, 600);
    this.cameras.main.setBounds(0, 0, 1600, 600);
    this.cameras.main.startFollow(this.player || { x: 0, y: 0 });

    // Create platforms
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.platforms.create(800, 580, undefined) as Phaser.Physics.Arcade.StaticSprite;
    ground.setScale(4).refreshBody();

    // Create level platforms
    this.createLevel();

    // Create player
    this.player = this.physics.add.sprite(100, 450, undefined);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Create collectibles and enemies
    this.collectibles = this.physics.add.group();
    this.enemies = this.physics.add.group();

    for (let i = 0; i < 8; i++) {
      const x = 200 + i * 200;
      this.collectibles.create(x, 400, undefined).setTint(COLORS.collectible);

      if (i % 2 === 0) {
        this.enemies.create(x + 100, 350, undefined).setTint(COLORS.enemy);
      }
    }

    // Physics
    this.physics.add.collider(this.player, this.platforms, () => {
      this.canJump = true;
    });

    this.physics.add.overlap(this.player, this.collectibles, (obj1, obj2) => {
      (obj2 as Phaser.Physics.Arcade.Image).destroy();
      this.score += 100;
      this.collectiblesCount++;
      this.tone.play("success");
    });

    this.physics.add.overlap(this.player, this.enemies, () => {
      if (this.gameActive) {
        this.gameActive = false;
        this.gameOver();
      }
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.callbacks.onReady(this);
  }

  update() {
    if (!this.gameActive) return;

    // Movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (this.cursors.space.isDown && this.canJump) {
      this.player.setVelocityY(-330);
      this.canJump = false;
      this.tone.play("success");
    }

    // Enemy movement
    this.enemies.children.entries.forEach((enemy: any) => {
      if (!enemy.getData("direction")) {
        enemy.setData("direction", 1);
      }

      enemy.x += enemy.getData("direction") * 2;

      if (enemy.x > 1600 || enemy.x < 0) {
        enemy.destroy();
      }
    });

    // Level progression
    if (this.player.x > 1500) {
      this.level++;
      this.score += 500;
      this.createNewLevel();
    }

    this.updateHud();
  }

  private createLevel() {
    const groundY = 500;
    for (let i = 0; i < 5; i++) {
      const platform = this.platforms.create(300 + i * 400, groundY - 100, undefined) as Phaser.Physics.Arcade.StaticSprite;
      platform.displayWidth = 100;
      platform.refreshBody();
    }
  }

  private createNewLevel() {
    this.player.x = 100;
    this.collectibles.clear(true, true);
    this.enemies.clear(true, true);

    for (let i = 0; i < 8; i++) {
      const x = 200 + i * 200;
      this.collectibles.create(x, 400, undefined).setTint(COLORS.collectible);

      if (i % 2 === 0) {
        this.enemies.create(x + 100, 350, undefined).setTint(COLORS.enemy);
      }
    }
  }

  private updateHud() {
    this.callbacks.onHud({
      score: this.score,
      collectibles: this.collectiblesCount,
      level: this.level,
    });
  }

  private gameOver() {
    this.physics.pause();
    this.tone.play("gameover");
    this.time.delayedCall(500, () => {
      this.callbacks.onGameOver({
        score: this.score,
        collectibles: this.collectiblesCount,
        level: this.level,
      });
    });
  }
}

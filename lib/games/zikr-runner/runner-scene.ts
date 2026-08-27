import * as Phaser from "phaser";
import { ToneFeedback } from "@/lib/games/tone-feedback";

export type RunnerHud = {
  score: number;
  collectibles: number;
  distance: number;
  speed: number;
};

export type RunnerSceneCallbacks = {
  onReady: (scene: ZikrRunnerScene) => void;
  onHud: (hud: RunnerHud) => void;
  onGameOver: (hud: RunnerHud) => void;
};

type RunnerData = {
  callbacks: RunnerSceneCallbacks;
};

type RunnerObject = Phaser.Physics.Arcade.Image | Phaser.Physics.Arcade.Sprite;

const COLORS = {
  background: 0x071b24,
  road: 0x102f3a,
  lane: 0x23606a,
  gold: 0xf3c969,
  cream: 0xfff7dc,
  emerald: 0x5fd1a6,
  obstacle: 0xe28a5a,
};

export class ZikrRunnerScene extends Phaser.Scene {
  private callbacks: RunnerSceneCallbacks;
  private readonly tone = new ToneFeedback();
  private player!: Phaser.GameObjects.Rectangle;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private stars!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private laneIndex = 1;
  private readonly laneCount = 3;
  private runTime = 0;
  private score = 0;
  private collectibles = 0;
  private distance = 0;
  private speed = 230;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private hudTimer?: Phaser.Time.TimerEvent;
  private running = false;
  private muted = false;
  private touchStart?: { x: number; y: number; time: number };
  private lastMoveAt = 0;
  private gameOverSent = false;

  constructor(callbacks: RunnerSceneCallbacks) {
    super({ key: "zikr-runner" });
    this.callbacks = callbacks;
  }

  create(data?: RunnerData) {
    if (data?.callbacks) this.callbacks = data.callbacks;

    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.background);

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a2c38, 0x071b24, 0x0c2630, 0x071b24, 1);
    sky.fillRect(0, 0, width, height);

    const roadWidth = Math.min(width * 0.92, 520);
    const roadLeft = (width - roadWidth) / 2;
    const road = this.add.rectangle(width / 2, height / 2, roadWidth, height, COLORS.road, 1);
    road.setDepth(-2);

    for (let i = 1; i < this.laneCount; i += 1) {
      const x = roadLeft + (roadWidth / this.laneCount) * i;
      const divider = this.add.rectangle(x, height / 2, 3, height, COLORS.lane, 0.85);
      divider.setDepth(-1);
    }

    this.player = this.add.rectangle(this.laneX(this.laneIndex), height - 118, 42, 58, COLORS.emerald, 1);
    this.player.setStrokeStyle(4, COLORS.gold, 1);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setAllowGravity(true);
    this.playerBody.setGravityY(900);
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setSize(38, 54);

    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.stars = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.obstacles, this.handleObstacleHit, undefined, this);
    this.physics.add.overlap(this.player, this.stars, this.handleStarCollect, undefined, this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.leftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.touchStart = { x: pointer.x, y: pointer.y, time: pointer.event.timeStamp || Date.now() };
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.touchStart) return;
      const dx = pointer.x - this.touchStart.x;
      const dy = pointer.y - this.touchStart.y;
      const elapsed = Math.max(1, (pointer.event.timeStamp || Date.now()) - this.touchStart.time);
      this.touchStart = undefined;
      if (elapsed > 700 || Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) this.moveLane(dx > 0 ? 1 : -1);
      else if (dy < 0) this.jump();
      else this.slide();
    });

    this.spawnTimer = this.time.addEvent({ delay: 850, loop: true, callback: this.spawnRow, callbackScope: this });
    this.hudTimer = this.time.addEvent({ delay: 100, loop: true, callback: this.emitHud, callbackScope: this });
    this.running = true;
    this.callbacks.onReady(this);
    this.emitHud();
  }

  update(_: number, delta: number) {
    if (!this.running || this.gameOverSent) return;
    const dt = Math.min(delta, 50);
    this.runTime += dt;
    this.distance += (this.speed * dt) / 1000;
    this.score = Math.floor(this.distance) + this.collectibles * 50;
    this.speed = Math.min(620, 230 + Math.floor(this.runTime / 4_000) * 18);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.leftKey)) this.moveLane(-1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.rightKey)) this.moveLane(1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.cursors.space!)) this.jump();
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.downKey)) this.slide();

    const targetX = this.laneX(this.laneIndex);
    this.player.x = Phaser.Math.Linear(this.player.x, targetX, 0.24);
    this.playerBody.setVelocityX(0);

    this.moveGroup(this.obstacles, dt);
    this.moveGroup(this.stars, dt);
    this.cleanupGroup(this.obstacles);
    this.cleanupGroup(this.stars);
  }

  pauseGame() {
    if (!this.running || this.gameOverSent) return;
    this.scene.pause();
  }

  resumeGame() {
    if (!this.gameOverSent) this.scene.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.sound.mute = this.muted;
    return this.muted;
  }

  restartGame() {
    this.scene.restart({ callbacks: this.callbacks });
  }

  setMuted(value: boolean) {
    this.muted = value;
    this.sound.mute = value;
    this.tone.setMuted(value);
  }

  private laneX(index: number) {
    const roadWidth = Math.min(this.scale.width * 0.92, 520);
    const roadLeft = (this.scale.width - roadWidth) / 2;
    return roadLeft + roadWidth * ((index + 0.5) / this.laneCount);
  }

  private moveLane(direction: -1 | 1) {
    const now = this.time.now;
    if (!this.running || now - this.lastMoveAt < 120) return;
    this.lastMoveAt = now;
    this.laneIndex = Phaser.Math.Clamp(this.laneIndex + direction, 0, this.laneCount - 1);
  }

  private jump() {
    if (!this.running || this.gameOverSent || this.playerBody.blocked.down || this.playerBody.touching.down) return;
    this.playerBody.setVelocityY(-560);
  }

  private slide() {
    if (!this.running || this.gameOverSent || !this.playerBody.blocked.down) return;
    this.player.setScale(1, 0.65);
    this.time.delayedCall(420, () => this.player?.setScale(1, 1));
  }

  private spawnRow() {
    if (!this.running || this.gameOverSent) return;
    const lane = Phaser.Math.Between(0, this.laneCount - 1);
    const obstacle = this.add.rectangle(this.laneX(lane), -42, 48, 42, COLORS.obstacle, 1);
    obstacle.setStrokeStyle(3, COLORS.gold, 0.8);
    this.obstacles.add(obstacle);

    if (Phaser.Math.FloatBetween(0, 1) > 0.28) {
      const starLane = Phaser.Math.Between(0, this.laneCount - 1);
      const star = this.add.circle(this.laneX(starLane), -120, 15, COLORS.gold, 1);
      star.setStrokeStyle(3, COLORS.cream, 0.8);
      this.stars.add(star);
    }
  }

  private moveGroup(group: Phaser.Physics.Arcade.Group, delta: number) {
    group.children.each(child => {
      const object = child as RunnerObject;
      object.y += (this.speed * delta) / 1000;
      return true;
    });
  }

  private cleanupGroup(group: Phaser.Physics.Arcade.Group) {
    group.children.each(child => {
      const object = child as RunnerObject;
      if (object.y > this.scale.height + 80) object.destroy();
      return true;
    });
  }

  private handleObstacleHit() {
    if (this.gameOverSent) return;
    this.tone.play(180, 0.12);
    this.gameOverSent = true;
    this.running = false;
    this.spawnTimer?.remove(false);
    this.hudTimer?.remove(false);
    this.playerBody.setVelocity(0, 0);
    this.cameras.main.shake(180, 0.008);
    this.callbacks.onGameOver(this.currentHud());
    this.tone.dispose();
  }

  private handleStarCollect(_: unknown, starObject: unknown) {
    if (!starObject || typeof starObject !== "object" || !("destroy" in starObject)) return;
    (starObject as Phaser.GameObjects.GameObject).destroy();
    this.collectibles += 1;
    this.tone.play(520, 0.07);
    this.score = Math.floor(this.distance) + this.collectibles * 50;
  }

  private currentHud(): RunnerHud {
    return {
      score: this.score,
      collectibles: this.collectibles,
      distance: Math.floor(this.distance),
      speed: Math.round(this.speed),
    };
  }

  private emitHud() {
    this.callbacks.onHud(this.currentHud());
  }
}

import * as Phaser from "phaser";
import type { GameId } from "@/lib/games/registry";

export type ArcadeHud = {
  score: number;
  collectibles: number;
  distance: number;
  speed: number;
  combo: number;
  level: number;
  completed: boolean;
};

export type ArcadeSceneCallbacks = {
  onReady: (scene: ArcadeGameScene) => void;
  onHud: (hud: ArcadeHud) => void;
  onGameOver: (hud: ArcadeHud) => void;
};

type ArcadeMode = "lanes" | "jump" | "fly" | "adventure";

const COLORS = {
  background: 0x071b24,
  road: 0x102f3a,
  lane: 0x23606a,
  gold: 0xf3c969,
  cream: 0xfff7dc,
  emerald: 0x5fd1a6,
  obstacle: 0xe28a5a,
  sky: 0x0c3343,
  platform: 0x39776f,
};

function modeForGame(gameId: GameId): ArcadeMode {
  if (gameId === "zikr-jump") return "jump";
  if (gameId === "hilal-fly") return "fly";
  if (gameId === "mosque-adventure") return "adventure";
  return "lanes";
}

export class ArcadeGameScene extends Phaser.Scene {
  private callbacks!: ArcadeSceneCallbacks;
  private readonly gameId: GameId;
  private readonly mode: ArcadeMode;
  private player!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private hazards!: Phaser.Physics.Arcade.Group;
  private stars!: Phaser.Physics.Arcade.Group;
  private platforms?: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private runTime = 0;
  private score = 0;
  private collectibles = 0;
  private distance = 0;
  private speed = 200;
  private combo = 0;
  private level = 1;
  private muted = false;
  private running = false;
  private gameOverSent = false;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private hudTimer?: Phaser.Time.TimerEvent;
  private touchStart?: { x: number; y: number; time: number };
  private laneIndex = 1;
  private readonly laneCount = 3;

  constructor(gameId: GameId, callbacks: ArcadeSceneCallbacks) {
    super({ key: `zikr-${gameId}` });
    this.gameId = gameId;
    this.mode = modeForGame(gameId);
    this.callbacks = callbacks;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor(this.mode === "fly" ? COLORS.sky : COLORS.background);
    const background = this.add.graphics();
    background.fillGradientStyle(COLORS.sky, COLORS.background, COLORS.background, COLORS.sky, 1);
    background.fillRect(0, 0, width, height);

    if (this.mode === "lanes" || this.mode === "adventure") this.createLanes(width, height);
    if (this.mode === "jump") this.createPlatforms(width, height);

    const playerColor = this.mode === "fly" ? COLORS.gold : COLORS.emerald;
    this.player = this.mode === "fly"
      ? this.add.circle(width * 0.25, height * 0.5, 24, playerColor, 1)
      : this.add.rectangle(this.mode === "jump" ? width * 0.25 : this.laneX(this.laneIndex), this.mode === "jump" ? height - 170 : height - 118, 42, 54, playerColor, 1);
    this.player.setStrokeStyle(4, COLORS.gold, 1);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setCollideWorldBounds(true);

    if (this.mode === "fly") this.playerBody.setAllowGravity(true).setGravityY(470);
    else if (this.mode === "jump") this.playerBody.setAllowGravity(true).setGravityY(900);
    else this.playerBody.setAllowGravity(false);

    this.hazards = this.physics.add.group({ allowGravity: false, immovable: true });
    this.stars = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.hazards, this.handleHazard, undefined, this);
    this.physics.add.overlap(this.player, this.stars, this.handleStar, undefined, this);
    if (this.platforms) this.physics.add.collider(this.player, this.platforms);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.leftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
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
      if (elapsed > 700 || Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) this.moveLane(dx > 0 ? 1 : -1);
      else if (dy < 0) this.jump();
      else if (this.mode === "fly") this.jump();
    });

    this.spawnTimer = this.time.addEvent({ delay: 720, loop: true, callback: this.spawnObjects, callbackScope: this });
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
    this.level = Math.max(1, 1 + Math.floor(this.runTime / 8_000));
    this.speed = Math.min(580, 200 + this.level * 18);

    if (this.mode === "lanes" || this.mode === "adventure") {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.leftKey)) this.moveLane(-1);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.rightKey)) this.moveLane(1);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.jumpKey)) this.jump();
      this.player.x = Phaser.Math.Linear(this.player.x, this.laneX(this.laneIndex), 0.24);
    } else if (this.mode === "jump") {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.cursors.space!)) this.jump();
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.leftKey)) this.playerBody.setVelocityX(-180);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.rightKey)) this.playerBody.setVelocityX(180);
      this.playerBody.setVelocityX(this.playerBody.velocity.x * 0.96);
      if (this.player.y > this.scale.height + 80) this.endGame();
    } else {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.cursors.space!)) this.jump();
      if (this.player.y < -50 || this.player.y > this.scale.height + 50) this.endGame();
    }

    this.moveGroup(this.hazards, dt);
    this.moveGroup(this.stars, dt);
    this.cleanupGroup(this.hazards);
    this.cleanupGroup(this.stars);
    this.score = Math.floor(this.distance) + this.collectibles * 50 + this.combo * 10;
  }

  pauseGame() { if (this.running && !this.gameOverSent) this.scene.pause(); }
  resumeGame() { if (!this.gameOverSent) this.scene.resume(); }
  toggleMute() { this.muted = !this.muted; this.sound.mute = this.muted; return this.muted; }
  restartGame() { this.scene.restart(); }

  private createLanes(width: number, height: number) {
    const roadWidth = Math.min(width * 0.92, 520);
    const roadLeft = (width - roadWidth) / 2;
    this.add.rectangle(width / 2, height / 2, roadWidth, height, COLORS.road, 1).setDepth(-2);
    for (let i = 1; i < this.laneCount; i += 1) {
      const x = roadLeft + (roadWidth / this.laneCount) * i;
      this.add.rectangle(x, height / 2, 3, height, COLORS.lane, 0.85).setDepth(-1);
    }
  }

  private createPlatforms(width: number, height: number) {
    this.platforms = this.physics.add.staticGroup();
    const points = [
      { x: width * 0.22, y: height - 95, w: width * 0.36 },
      { x: width * 0.63, y: height - 210, w: width * 0.28 },
      { x: width * 0.27, y: height - 335, w: width * 0.25 },
      { x: width * 0.72, y: height - 460, w: width * 0.3 },
    ];
    points.forEach(point => {
      const platform = this.add.rectangle(point.x, point.y, point.w, 18, COLORS.platform, 1);
      platform.setStrokeStyle(2, COLORS.gold, 0.8);
      this.platforms!.add(platform);
    });
  }

  private spawnObjects() {
    if (!this.running || this.gameOverSent) return;
    if (this.mode === "jump") {
      const x = Phaser.Math.Between(80, Math.max(90, this.scale.width - 80));
      const y = Phaser.Math.Between(90, Math.max(100, this.scale.height - 260));
      this.spawnHazard(x, y, 34, 24, false);
      this.spawnStar(x + Phaser.Math.Between(-30, 30), y - 55);
      return;
    }
    if (this.mode === "fly") {
      const gapY = Phaser.Math.Between(110, this.scale.height - 110);
      this.spawnHazard(this.scale.width + 25, gapY - 115, 32, 230, true);
      this.spawnHazard(this.scale.width + 25, gapY + 115, 32, 230, true);
      this.spawnStar(this.scale.width + 25, gapY);
      return;
    }
    const lane = Phaser.Math.Between(0, this.laneCount - 1);
    const x = this.scale.width + 40;
    const y = this.scale.height - 116;
    this.spawnHazard(x, y, 34, 54, false, lane);
    if (Math.random() > 0.25) this.spawnStar(x + Phaser.Math.Between(50, 100), y - Phaser.Math.Between(30, 110), false, lane);
  }

  private spawnHazard(x: number, y: number, width: number, height: number, vertical: boolean, lane?: number) {
    const object = this.add.rectangle(x, y, width, height, COLORS.obstacle, 1);
    object.setStrokeStyle(2, COLORS.gold, 0.9);
    object.setData("vertical", vertical);
    object.setData("lane", lane ?? -1);
    this.hazards.add(object);
  }

  private spawnStar(x: number, y: number, _vertical = false, lane?: number) {
    const star = this.add.circle(x, y, 14, COLORS.gold, 1);
    star.setStrokeStyle(2, COLORS.cream, 0.8);
    star.setData("lane", lane ?? -1);
    this.stars.add(star);
  }

  private moveGroup(group: Phaser.Physics.Arcade.Group, dt: number) {
    group.children.each(child => {
      const object = child as Phaser.GameObjects.GameObject & { x: number; y: number };
      const vertical = Boolean(object.getData("vertical"));
      if (this.mode === "jump") object.y += this.speed * dt / 1000;
      else if (vertical) object.x -= this.speed * dt / 1000;
      else object.x -= this.speed * dt / 1000;
      return true;
    });
  }

  private cleanupGroup(group: Phaser.Physics.Arcade.Group) {
    group.children.each(child => {
      const object = child as Phaser.GameObjects.GameObject & { x: number; y: number };
      if (object.x < -100 || object.x > this.scale.width + 100 || object.y < -120 || object.y > this.scale.height + 160) object.destroy();
      return true;
    });
  }

  private moveLane(delta: number) { this.laneIndex = Phaser.Math.Clamp(this.laneIndex + delta, 0, this.laneCount - 1); }

  private laneX(lane: number) {
    const roadWidth = Math.min(this.scale.width * 0.92, 520);
    return (this.scale.width - roadWidth) / 2 + (roadWidth / this.laneCount) * (lane + 0.5);
  }

  private jump() {
    if (this.mode === "fly") this.playerBody.setVelocityY(-260);
    else if (this.mode === "jump" && (this.playerBody.blocked.down || this.playerBody.touching.down)) this.playerBody.setVelocityY(-490);
    else if (this.mode !== "jump") this.playerBody.setVelocityY(-360);
  }

  private handleHazard() { this.combo = 0; this.endGame(); }

  private handleStar(_: unknown, starObject: unknown) {
    if (!starObject || typeof starObject !== "object" || !("destroy" in starObject)) return;
    (starObject as Phaser.GameObjects.GameObject).destroy();
    this.collectibles += 1;
    this.combo += 1;
  }

  private currentHud(): ArcadeHud {
    return {
      score: Math.max(0, this.score),
      collectibles: Math.max(0, this.collectibles),
      distance: Math.max(0, Math.floor(this.distance)),
      speed: Math.floor(this.speed),
      combo: Math.max(0, this.combo),
      level: this.level,
      completed: false,
    };
  }

  private emitHud() { this.callbacks.onHud(this.currentHud()); }

  private endGame() {
    if (this.gameOverSent) return;
    this.gameOverSent = true;
    this.running = false;
    this.spawnTimer?.remove(false);
    this.hudTimer?.remove(false);
    this.callbacks.onGameOver(this.currentHud());
  }
}

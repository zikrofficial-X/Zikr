"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import {
  getZikrJumpLevels,
  getZikrJumpRules,
  type ZikrJumpLevel,
} from "@/lib/games/zikr-jump";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";

type Props = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

type PlayerModel = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  grounded: boolean;
  coyoteTime: number;
};

type JumpModel = {
  levelIndex: number;
  player: PlayerModel;
  cameraY: number;
  score: number;
  collectibles: number;
  combo: number;
  lives: number;
  completed: boolean;
  gameOver: boolean;
  collectedStarIds: Set<string>;
};

type SceneSnapshot = {
  levelIndex: number;
  playerX: number;
  playerY: number;
  cameraY: number;
  score: number;
  collectibles: number;
  combo: number;
  lives: number;
  completed: boolean;
  gameOver: boolean;
  collectedStarIds: string[];
};

const WORLD_WIDTH = 720;
const VIEW_HEIGHT = 520;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 62;
const PLATFORM_HEIGHT = 18;
const STAR_RADIUS = 18;

const THEME_CLASS: Record<ZikrJumpLevel["theme"], string> = {
  dawn: "bg-[radial-gradient(circle_at_top,#f3c96922,transparent_35%),linear-gradient(180deg,#163844,#091f28)]",
  garden: "bg-[radial-gradient(circle_at_top,#5fd1a622,transparent_35%),linear-gradient(180deg,#12383d,#071f27)]",
  courtyard: "bg-[radial-gradient(circle_at_top,#39776f33,transparent_40%),linear-gradient(180deg,#12323a,#071b24)]",
  sky: "bg-[radial-gradient(circle_at_top,#8ab6e233,transparent_42%),linear-gradient(180deg,#123448,#081e2a)]",
  moon: "bg-[radial-gradient(circle_at_70%_12%,#f3c96930,transparent_22%),linear-gradient(180deg,#111b3b,#071525)]",
  gold: "bg-[radial-gradient(circle_at_top,#f3c96933,transparent_38%),linear-gradient(180deg,#27352f,#0b1e24)]",
};

const levelBackgroundDecoration: Record<ZikrJumpLevel["theme"], string[]> = {
  dawn: ["☀", "✦", "✦", "☁"],
  garden: ["✦", "❋", "✦", "☁"],
  courtyard: ["☾", "✦", "▧", "✦"],
  sky: ["☁", "✦", "✦", "☁"],
  moon: ["☾", "✦", "✦", "✦"],
  gold: ["✦", "☾", "✦", "✧"],
};

function makeInitialModel(
  levels: ZikrJumpLevel[],
  rules: ReturnType<typeof getZikrJumpRules>
): JumpModel {
  const first = levels[0];
  const start = first.platforms[0];
  return {
    levelIndex: 0,
    player: {
      x: start.x,
      y: start.y - PLAYER_HEIGHT / 2,
      velocityX: 0,
      velocityY: 0,
      grounded: true,
      coyoteTime: 0,
    },
    cameraY: Math.max(0, start.y - VIEW_HEIGHT + 180),
    score: 0,
    collectibles: 0,
    combo: 0,
    lives: rules.lives,
    completed: false,
    gameOver: false,
    collectedStarIds: new Set(),
  };
}

function snapshotFromModel(model: JumpModel): SceneSnapshot {
  return {
    levelIndex: model.levelIndex,
    playerX: model.player.x,
    playerY: model.player.y,
    cameraY: model.cameraY,
    score: model.score,
    collectibles: model.collectibles,
    combo: model.combo,
    lives: model.lives,
    completed: model.completed,
    gameOver: model.gameOver,
    collectedStarIds: Array.from(model.collectedStarIds),
  };
}

function hudFromSnapshot(
  snapshot: SceneSnapshot,
  levelCount: number
): WorldHud {
  return {
    score: snapshot.score,
    collectibles: snapshot.collectibles,
    distance: Math.max(
      0,
      Math.round(2080 - snapshot.playerY)
    ),
    combo: snapshot.combo,
    level: Math.min(levelCount, snapshot.levelIndex + 1),
    completed: snapshot.completed,
  };
}

function overlap(
  x1: number,
  y1: number,
  width1: number,
  height1: number,
  x2: number,
  y2: number,
  width2: number,
  height2: number
) {
  return (
    Math.abs(x1 - x2) * 2 < width1 + width2 &&
    Math.abs(y1 - y2) * 2 < height1 + height2
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function ZikrJumpGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const rules = getZikrJumpRules(difficulty);
  const levels = getZikrJumpLevels(difficulty);
  const modelRef = useRef<JumpModel>(makeInitialModel(levels, rules));
  const inputRef = useRef({
    left: false,
    right: false,
    jumpRequest: false,
  });
  const completedRef = useRef(false);
  const hudAccumulatorRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);

  const [scene, setScene] = useState<SceneSnapshot>(() =>
    snapshotFromModel(makeInitialModel(levels, rules))
  );
  const [feedback, setFeedback] = useState(
    "اقفز بين المنصات، اجمع النجوم، ووصل إلى بوابة نهاية المستوى."
  );

  const publishHud = useCallback(
    (snapshot: SceneSnapshot) => {
      const hud = hudFromSnapshot(snapshot, levels.length);
      onHud(hud);
      setScene(snapshot);
    },
    [levels.length, onHud]
  );

  const resetLevel = useCallback(() => {
    const model = modelRef.current;
    const level = levels[model.levelIndex];
    const start = level.platforms[0];
    model.player = {
      x: start.x,
      y: start.y - PLAYER_HEIGHT / 2,
      velocityX: 0,
      velocityY: 0,
      grounded: true,
      coyoteTime: 0,
    };
    model.cameraY = Math.max(
      0,
      start.y - VIEW_HEIGHT + 180
    );
    inputRef.current.jumpRequest = false;
  }, [levels]);

  const failAttempt = useCallback(
    (message: string) => {
      const model = modelRef.current;
      model.lives -= 1;
      model.combo = 0;
      model.score = Math.max(0, model.score - rules.hazardPenalty);

      if (model.lives <= 0) {
        model.gameOver = true;
        model.completed = false;
        const finalSnapshot = snapshotFromModel(model);
        publishHud(finalSnapshot);
        if (!completedRef.current) {
          completedRef.current = true;
          onSound("gameOver");
          setFeedback("انتهت المحاولات. أعد الجولة وحاول مرة أخرى.");
          onResult(hudFromSnapshot(finalSnapshot, levels.length));
        }
        return;
      }

      resetLevel();
      setFeedback(message + " بقي " + String(model.lives) + " محاولات.");
      onSound("miss");
      publishHud(snapshotFromModel(model));
    },
    [
      levels.length,
      onResult,
      onSound,
      publishHud,
      resetLevel,
      rules.hazardPenalty,
    ]
  );

  const advanceLevel = useCallback(() => {
    const model = modelRef.current;
    const previousLevel = levels[model.levelIndex];
    model.score += rules.levelBonus;
    model.levelIndex += 1;
    model.combo = 0;

    if (model.levelIndex >= levels.length) {
      model.completed = true;
      model.gameOver = false;
      model.score += rules.completionBonus;
      const finalSnapshot = snapshotFromModel(model);
      publishHud(finalSnapshot);
      if (!completedRef.current) {
        completedRef.current = true;
        onSound("success");
        setFeedback("أكملت قفزة ذِكر بكل مستوياتها. أحسنت!");
        onResult(hudFromSnapshot(finalSnapshot, levels.length));
      }
      return;
    }

    const level = levels[model.levelIndex];
    const start = level.platforms[0];
    model.player = {
      x: start.x,
      y: start.y - PLAYER_HEIGHT / 2,
      velocityX: 0,
      velocityY: 0,
      grounded: true,
      coyoteTime: 0,
    };
    model.cameraY = Math.max(0, start.y - VIEW_HEIGHT + 180);
    setFeedback(
      "اكتملت " +
        previousLevel.titleAr +
        ". انتقلنا إلى " +
        level.titleAr +
        "."
    );
    onSound("success");
    publishHud(snapshotFromModel(model));
  }, [
    levels,
    onResult,
    onSound,
    publishHud,
    rules.completionBonus,
    rules.levelBonus,
  ]);

  useEffect(() => {
    modelRef.current = makeInitialModel(levels, rules);
    inputRef.current = { left: false, right: false, jumpRequest: false };
    completedRef.current = false;
    setFeedback(
      "اقفز بين المنصات، اجمع النجوم، ووصل إلى بوابة نهاية المستوى."
    );
    publishHud(snapshotFromModel(modelRef.current));
  }, [
    difficulty,
    levels,
    publishHud,
    restartToken,
    rules,
  ]);

  useEffect(() => {
    const keyState = new Map<string, boolean>();

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        keyState.set(key, true);
        inputRef.current.left = true;
        event.preventDefault();
      }
      if (key === "arrowright" || key === "d") {
        keyState.set(key, true);
        inputRef.current.right = true;
        event.preventDefault();
      }
      if (
        key === "arrowup" ||
        key === "w" ||
        key === " "
      ) {
        if (!keyState.get(key)) {
          inputRef.current.jumpRequest = true;
        }
        keyState.set(key, true);
        event.preventDefault();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keyState.delete(key);
      if (key === "arrowleft" || key === "a") inputRef.current.left = false;
      if (key === "arrowright" || key === "d") inputRef.current.right = false;
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpRequest = false;
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    const tick = (timestamp: number) => {
      frame = window.requestAnimationFrame(tick);

      const last = lastFrameRef.current ?? timestamp;
      lastFrameRef.current = timestamp;
      const dt = Math.min(0.032, Math.max(0.008, (timestamp - last) / 1000));
      const model = modelRef.current;

      if (paused || model.completed || model.gameOver) return;

      const level = levels[model.levelIndex];
      const player = model.player;
      const previousBottom = player.y + PLAYER_HEIGHT / 2;

      const direction =
        Number(inputRef.current.right) - Number(inputRef.current.left);
      const targetVelocity = direction * rules.horizontalSpeed;
      player.velocityX +=
        (targetVelocity - player.velocityX) * Math.min(1, dt * 10);
      player.x += player.velocityX * dt;
      player.x = clamp(
        player.x,
        PLAYER_WIDTH / 2 + 12,
        WORLD_WIDTH - PLAYER_WIDTH / 2 - 12
      );

      if (inputRef.current.jumpRequest) {
        inputRef.current.jumpRequest = false;
        if (player.grounded || player.coyoteTime > 0) {
          player.velocityY = -rules.jumpVelocity;
          player.grounded = false;
          player.coyoteTime = 0;
          onSound("jump");
        }
      }

      const previousY = player.y;
      player.velocityY += rules.gravity * dt;
      player.y += player.velocityY * dt;
      player.grounded = false;

      for (const platform of level.platforms) {
        const playerLeft = player.x - PLAYER_WIDTH / 2;
        const playerRight = player.x + PLAYER_WIDTH / 2;
        const platformLeft = platform.x - platform.width / 2;
        const platformRight = platform.x + platform.width / 2;
        const currentBottom = player.y + PLAYER_HEIGHT / 2;

        if (
          player.velocityY >= 0 &&
          previousBottom <= platform.y &&
          currentBottom >= platform.y &&
          playerRight > platformLeft &&
          playerLeft < platformRight
        ) {
          player.y = platform.y - PLAYER_HEIGHT / 2;
          player.velocityY = 0;
          player.grounded = true;
          player.coyoteTime = 0.12;
          break;
        }
      }

      if (!player.grounded) {
        player.coyoteTime = Math.max(0, player.coyoteTime - dt);
      }

      if (difficulty !== "easy") {
        let hazardHit = false;
        for (const hazard of level.hazards) {
          const platform = level.platforms[hazard.platformIndex];
          if (!platform) continue;
          const hazardX = platform.x + hazard.offset;
          const hazardY = platform.y - 22;
          if (
            overlap(
              player.x,
              player.y,
              PLAYER_WIDTH - 10,
              PLAYER_HEIGHT - 8,
              hazardX,
              hazardY,
              46,
              34
            )
          ) {
            hazardHit = true;
            failAttempt("انتبه للعائق على المنصة.");
            break;
          }
        }
        if (hazardHit) return;
      }

      if (model.gameOver || model.completed) {
        return;
      }

      for (let index = 0; index < level.stars.length; index += 1) {
        const star = level.stars[index];
        const starId = String(model.levelIndex) + ":" + String(index);
        if (model.collectedStarIds.has(starId)) continue;

        if (
          Math.hypot(player.x - star.x, player.y - star.y) <
          STAR_RADIUS + 28
        ) {
          model.collectedStarIds.add(starId);
          model.collectibles += 1;
          model.combo += 1;
          model.score += rules.starReward + Math.min(80, model.combo * 10);
          onSound("collect");
          setFeedback("نجمة! حافظ على القفزة التالية.");
        }
      }

      const goalPlatform = level.platforms[level.goalPlatformIndex];
      if (
        goalPlatform &&
        player.grounded &&
        player.y <= goalPlatform.y + 10 &&
        player.x >
          goalPlatform.x - goalPlatform.width / 2 &&
        player.x <
          goalPlatform.x + goalPlatform.width / 2 &&
        previousY > goalPlatform.y
      ) {
        advanceLevel();
        return;
      }

      if (
        player.y >
        rules.maxFallDistance - VIEW_HEIGHT * 0.25 &&
        player.y > model.cameraY + VIEW_HEIGHT + 120
      ) {
        failAttempt("سقطت قبل الوصول إلى المنصة التالية.");
        return;
      }

      model.cameraY = clamp(
        player.y - 275,
        0,
        Math.max(0, 2280 - VIEW_HEIGHT)
      );

      hudAccumulatorRef.current += dt * 1000;
      const nextSnapshot = snapshotFromModel(model);
      setScene(nextSnapshot);

      if (hudAccumulatorRef.current >= 100) {
        hudAccumulatorRef.current = 0;
        onHud(hudFromSnapshot(nextSnapshot, levels.length));
      }

      void previousY;
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      lastFrameRef.current = null;
    };
  }, [
    advanceLevel,
    difficulty,
    failAttempt,
    levels,
    onHud,
    onSound,
    paused,
    rules,
  ]);

  const currentLevel = levels[scene.levelIndex] ?? levels[levels.length - 1];
  const theme = currentLevel.theme;
  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((2080 - scene.playerY) /
          Math.max(1, 2080 - currentLevel.platforms[currentLevel.goalPlatformIndex].y)) *
          100
      )
    )
  );

  const setHeldInput = (
    direction: "left" | "right",
    value: boolean
  ) => {
    inputRef.current[direction] = value;
  };

  const requestJump = () => {
    inputRef.current.jumpRequest = true;
  };

  const preventScroll = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <section
      dir="rtl"
      aria-label="قفزة ذِكر"
      className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[#061a23] p-4 shadow-2xl shadow-black/20 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-emerald/80">
            ZIKR JUMP
          </p>
          <h3 className="mt-1 text-2xl font-black text-brand-cream">
            قفزة ذِكر
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/65">
            {currentLevel.subtitleAr} اجمع النجوم ووصل إلى بوابة نهاية المستوى
            دون استعجال.
          </p>
        </div>

        <div className="min-w-52 rounded-2xl border border-brand-cream/10 bg-black/20 p-4">
          <div className="flex items-center justify-between text-xs text-brand-cream/55">
            <span>تقدم المستوى</span>
            <strong className="text-brand-gold">{progressPercent}%</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-emerald transition-[width] duration-150"
              style={{ width: progressPercent + "%" }}
            />
          </div>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          ["المستوى", String(scene.levelIndex + 1) + "/" + String(levels.length), "text-violet-200"],
          ["النقاط", scene.score, "text-brand-gold"],
          ["النجوم", scene.collectibles, "text-brand-emerald"],
          ["السلسلة", scene.combo, "text-brand-cream"],
          ["المحاولات", scene.lives, "text-sky-200"],
          ["الارتفاع", Math.max(0, Math.round(2080 - scene.playerY)), "text-amber-200"],
        ].map(([label, value, className]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
          >
            <span className="block text-xs text-brand-cream/45">{label}</span>
            <strong className={"mt-1 block text-lg " + String(className)}>
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div
        className={[
          "relative mx-auto h-[520px] max-w-2xl touch-none overflow-hidden rounded-3xl border border-brand-gold/15",
          THEME_CLASS[theme],
        ].join(" ")}
        role="application"
        aria-label="منصة قفز تفاعلية"
      >
        <div className="pointer-events-none absolute inset-0 opacity-70">
          {levelBackgroundDecoration[theme].map((decoration, index) => (
            <span
              key={String(index)}
              className="absolute select-none text-2xl text-brand-gold/30"
              style={{
                left: String(8 + index * 22) + "%",
                top: String(12 + ((index * 17) % 46)) + "%",
              }}
            >
              {decoration}
            </span>
          ))}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,#061a2388)]" />
        </div>

        {currentLevel.platforms.map((platform, index) => {
          const screenY = platform.y - scene.cameraY;
          if (screenY < -40 || screenY > VIEW_HEIGHT + 40) return null;

          const isGoal = index === currentLevel.goalPlatformIndex;
          return (
            <div
              key={String(index) + "-" + String(platform.x) + "-" + String(platform.y)}
              className={[
                "absolute rounded-full border-2 shadow-lg",
                isGoal
                  ? "border-brand-gold bg-brand-gold/80 shadow-brand-gold/20"
                  : "border-brand-emerald/50 bg-brand-emerald/45 shadow-brand-emerald/10",
              ].join(" ")}
              style={{
                left: String(((platform.x - platform.width / 2) / WORLD_WIDTH) * 100) + "%",
                top: String(screenY) + "px",
                width: String((platform.width / WORLD_WIDTH) * 100) + "%",
                height: String(PLATFORM_HEIGHT) + "px",
                transform: "translateY(-50%)",
              }}
            >
              {isGoal && (
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-2xl text-brand-gold">
                  ⚑
                </span>
              )}
            </div>
          );
        })}

        {currentLevel.stars.map((star, index) => {
          const starId = String(scene.levelIndex) + ":" + String(index);
          const isCollected =
            scene.collectedStarIds.includes(starId);
          const screenY = star.y - scene.cameraY;
          if (isCollected || screenY < -40 || screenY > VIEW_HEIGHT + 40) {
            return null;
          }

          return (
            <div
              key={starId}
              className="absolute grid h-9 w-9 place-items-center rounded-full border-2 border-brand-cream/80 bg-brand-gold text-xl text-[#513f08] shadow-lg shadow-brand-gold/20"
              style={{
                left: String((star.x / WORLD_WIDTH) * 100) + "%",
                top: String(screenY) + "px",
                transform: "translate(-50%, -50%)",
              }}
              aria-hidden="true"
            >
              ★
            </div>
          );
        })}

        {difficulty !== "easy" &&
          currentLevel.hazards.map((hazard, index) => {
            const platform = currentLevel.platforms[hazard.platformIndex];
            if (!platform) return null;
            const screenY = platform.y - scene.cameraY - 24;
            if (screenY < -40 || screenY > VIEW_HEIGHT + 40) return null;

            return (
              <div
                key={"hazard-" + String(index)}
                className="absolute grid h-8 w-12 place-items-center rounded-xl border-2 border-[#ffd9a8] bg-[#a34f27] text-sm font-black text-[#fff7dc] shadow-lg shadow-black/25"
                style={{
                  left: String(((platform.x + hazard.offset) / WORLD_WIDTH) * 100) + "%",
                  top: String(screenY) + "px",
                  transform: "translate(-50%, -50%)",
                }}
                aria-label="عائق"
              >
                !
              </div>
            );
          })}

        <div
          className="absolute z-20 grid rounded-2xl border-4 border-brand-gold bg-brand-emerald text-3xl text-[#063127] shadow-xl shadow-brand-emerald/20 transition-[left,top] duration-75 ease-out"
          style={{
            left: String((scene.playerX / WORLD_WIDTH) * 100) + "%",
            top: String(scene.playerY - scene.cameraY) + "px",
            width: String(PLAYER_WIDTH) + "px",
            height: String(PLAYER_HEIGHT) + "px",
            transform: "translate(-50%, -50%)",
          }}
          aria-label="شخصية اللاعب"
        >
          ✦
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-black/30 px-4 py-4 backdrop-blur-sm sm:px-5">
          <button
            type="button"
            onPointerDown={(event) => {
              preventScroll(event);
              setHeldInput("right", true);
            }}
            onPointerUp={() => setHeldInput("right", false)}
            onPointerCancel={() => setHeldInput("right", false)}
            onPointerLeave={() => setHeldInput("right", false)}
            disabled={scene.completed || scene.gameOver}
            className="min-h-14 min-w-20 rounded-2xl border border-brand-cream/15 bg-black/20 px-5 text-2xl text-brand-cream hover:border-brand-gold disabled:opacity-40"
            aria-label="التحرك يمينًا"
          >
            →
          </button>

          <button
            type="button"
            onPointerDown={(event) => {
              preventScroll(event);
              requestJump();
            }}
            disabled={scene.completed || scene.gameOver}
            className="min-h-16 min-w-24 rounded-2xl border-2 border-brand-gold bg-brand-gold/15 px-5 text-lg font-black text-brand-gold shadow-lg shadow-brand-gold/10 disabled:opacity-40"
            aria-label="القفز"
          >
            قفز
          </button>

          <button
            type="button"
            onPointerDown={(event) => {
              preventScroll(event);
              setHeldInput("left", true);
            }}
            onPointerUp={() => setHeldInput("left", false)}
            onPointerCancel={() => setHeldInput("left", false)}
            onPointerLeave={() => setHeldInput("left", false)}
            disabled={scene.completed || scene.gameOver}
            className="min-h-14 min-w-20 rounded-2xl border border-brand-cream/15 bg-black/20 px-5 text-2xl text-brand-cream hover:border-brand-gold disabled:opacity-40"
            aria-label="التحرك يسارًا"
          >
            ←
          </button>
        </div>

        {(scene.completed || scene.gameOver) && (
          <div className="absolute inset-0 z-40 grid place-items-center bg-[#041118]/85 p-5 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-brand-gold/20 bg-[#091a28] p-6 text-center shadow-2xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-brand-emerald/80">
                ZIKR JUMP
              </p>
              <h4 className="mt-2 text-3xl font-black text-brand-cream">
                {scene.completed ? "أكملت الرحلة!" : "انتهت المحاولات"}
              </h4>
              <p className="mt-3 text-sm leading-7 text-brand-cream/60">
                {scene.completed
                  ? "فتحت جميع مستويات قفزة ذِكر وجمعت " +
                    String(scene.collectibles) +
                    " نجمة."
                  : "خذ استراحة قصيرة ثم أعد الجولة من زر إعادة اللعب في اللعبة."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="block text-xs text-brand-cream/45">النقاط</span>
                  <strong className="mt-1 block text-xl text-brand-gold">
                    {scene.score}
                  </strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="block text-xs text-brand-cream/45">النجوم</span>
                  <strong className="mt-1 block text-xl text-brand-emerald">
                    {scene.collectibles}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="mt-4 min-h-14 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.04] px-4 py-3 text-sm leading-7 text-brand-cream/70"
        role="status"
        aria-live="polite"
      >
        {feedback}
      </div>
    </section>
  );
}

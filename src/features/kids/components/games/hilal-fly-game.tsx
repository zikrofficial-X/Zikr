"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import {
  getHilalFlyLevels,
  getHilalFlyRules,
  type HilalFlyLevel,
} from "@/lib/games/hilal-fly";
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

type FlyObject =
  | {
      id: number;
      kind: "obstacle";
      x: number;
      gapY: number;
      gapHeight: number;
      style: HilalFlyLevel["obstacleStyle"];
    }
  | {
      id: number;
      kind: "star";
      x: number;
      y: number;
    };

type FlyModel = {
  y: number;
  velocityY: number;
  distance: number;
  score: number;
  collectibles: number;
  combo: number;
  lives: number;
  objects: FlyObject[];
  nextObstacleDistance: number;
  nextStarDistance: number;
  levelIndex: number;
  completedLevelCount: number;
  completed: boolean;
  gameOver: boolean;
  invulnerableUntil: number;
  seed: number;
};

type Snapshot = {
  y: number;
  distance: number;
  score: number;
  collectibles: number;
  combo: number;
  lives: number;
  levelIndex: number;
  completedLevelCount: number;
  completed: boolean;
  gameOver: boolean;
  objects: FlyObject[];
};

const VIEW_WIDTH = 760;
const VIEW_HEIGHT = 520;
const PLAYER_X = 145;
const PLAYER_SIZE = 56;
const HITBOX = 42;
const MIN_Y = 62;
const MAX_Y = VIEW_HEIGHT - 78;

const BACKDROP_STARS = [
  [8, 15], [18, 33], [28, 9], [39, 24], [51, 12], [62, 31], [74, 14],
  [86, 23], [94, 8], [12, 57], [25, 76], [43, 62], [59, 82], [79, 67],
  [91, 55], [69, 49], [34, 46], [6, 38],
] as const;

function createModel(
  rules: ReturnType<typeof getHilalFlyRules>,
  level: HilalFlyLevel
): FlyModel {
  const initialObstacleDistance =
    Math.max(220, rules.speed * (rules.spawnInterval / 1000) * 1.7);

  return {
    y: VIEW_HEIGHT / 2,
    velocityY: 0,
    distance: 0,
    score: 0,
    collectibles: 0,
    combo: 0,
    lives: rules.lives,
    objects: [],
    nextObstacleDistance: initialObstacleDistance,
    nextStarDistance: Math.max(
      280,
      rules.speed * (rules.starInterval / 1000) * 1.8
    ),
    levelIndex: 0,
    completedLevelCount: 0,
    completed: false,
    gameOver: false,
    invulnerableUntil: 0,
    seed: level.id.length * 97 + 17,
  };
}

function nextRandom(model: FlyModel) {
  model.seed = (model.seed * 1664525 + 1013904223) >>> 0;
  return model.seed / 4294967296;
}

function snapshotFromModel(model: FlyModel): Snapshot {
  return {
    y: model.y,
    distance: Math.floor(model.distance),
    score: Math.max(0, Math.floor(model.score)),
    collectibles: model.collectibles,
    combo: model.combo,
    lives: model.lives,
    levelIndex: model.levelIndex,
    completedLevelCount: model.completedLevelCount,
    completed: model.completed,
    gameOver: model.gameOver,
    invulnerable: model.invulnerableUntil > performance.now(),
    objects: model.objects,
  };
}

function hudFromSnapshot(snapshot: Snapshot, levelCount: number): WorldHud {
  return {
    score: snapshot.score,
    collectibles: snapshot.collectibles,
    distance: snapshot.distance,
    combo: snapshot.combo,
    level: Math.min(levelCount, snapshot.levelIndex + 1),
    completed: snapshot.completed,
  };
}

function circleHit(
  cx: number,
  cy: number,
  radius: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const nearestX = Math.max(x, Math.min(cx, x + width));
  const nearestY = Math.max(y, Math.min(cy, y + height));
  return Math.hypot(cx - nearestX, cy - nearestY) <= radius;
}

function obstacleHitsPlayer(
  playerY: number,
  obstacle: Extract<FlyObject, { kind: "obstacle" }>
) {
  const obstacleLeft = obstacle.x - 44;
  const obstacleRight = obstacle.x + 44;
  if (PLAYER_X + HITBOX / 2 < obstacleLeft || PLAYER_X - HITBOX / 2 > obstacleRight) {
    return false;
  }

  const topHeight = obstacle.gapY - obstacle.gapHeight / 2;
  const bottomTop = obstacle.gapY + obstacle.gapHeight / 2;
  const bottomHeight = VIEW_HEIGHT - bottomTop;

  return (
    circleHit(PLAYER_X, playerY, HITBOX / 2, obstacleLeft, 0, 88, Math.max(0, topHeight)) ||
    circleHit(PLAYER_X, playerY, HITBOX / 2, obstacleLeft, bottomTop, 88, Math.max(0, bottomHeight))
  );
}

function obstacleClass(style: HilalFlyLevel["obstacleStyle"]) {
  switch (style) {
    case "cloud":
      return "rounded-[2rem] border-2 border-white/20 bg-white/12 shadow-lg";
    case "gate":
      return "rounded-2xl border-2 border-sky-200/50 bg-sky-200/15 shadow-lg";
    case "lantern":
      return "rounded-2xl border-2 border-fuchsia-200/50 bg-fuchsia-200/15 shadow-lg";
    case "arch":
      return "rounded-[2rem] border-2 border-brand-emerald/50 bg-brand-emerald/15 shadow-lg";
    case "crystal":
      return "rounded-xl border-2 border-violet-200/60 bg-violet-200/15 shadow-lg";
    default:
      return "rounded-2xl border-2 border-brand-gold/70 bg-brand-gold/15 shadow-lg";
  }
}

export function HilalFlyGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const rules = getHilalFlyRules(difficulty);
  const levels = getHilalFlyLevels(difficulty);
  const modelRef = useRef<FlyModel>(createModel(rules, levels[0]));
  const inputRef = useRef({ up: false, down: false });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onHudRef = useRef(onHud);
  const onResultRef = useRef(onResult);
  const onSoundRef = useRef(onSound);
  const pausedRef = useRef(paused);
  const completedRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);

  const [snapshot, setSnapshot] = useState<Snapshot>(() =>
    snapshotFromModel(createModel(rules, levels[0]))
  );
  const [feedback, setFeedback] = useState(
    "حرّك الهلال لأعلى أو لأسفل، مر بين الحواجز واجمع النجوم."
  );

  useEffect(() => {
    onHudRef.current = onHud;
    onResultRef.current = onResult;
    onSoundRef.current = onSound;
    pausedRef.current = paused;
  }, [onHud, onResult, onSound, paused]);

  useEffect(() => {
    const first = levels[0];
    modelRef.current = createModel(rules, first);
    inputRef.current = { up: false, down: false };
    touchStartRef.current = null;
    completedRef.current = false;
    lastFrameRef.current = null;
    const next = snapshotFromModel(modelRef.current);
    setSnapshot(next);
    onHudRef.current(hudFromSnapshot(next, levels.length));
    setFeedback("حرّك الهلال لأعلى أو لأسفل، مر بين الحواجز واجمع النجوم.");
  }, [difficulty, restartToken]);

  useEffect(() => {
    let frame = 0;

    const tick = (timestamp: number) => {
      frame = window.requestAnimationFrame(tick);
      const last = lastFrameRef.current ?? timestamp;
      lastFrameRef.current = timestamp;
      const dt = Math.min(0.032, Math.max(0.008, (timestamp - last) / 1000));
      const model = modelRef.current;

      if (pausedRef.current || model.completed || model.gameOver) return;

      const currentLevel = levels[model.levelIndex];
      const levelDistance = rules.goalDistance / Math.max(1, levels.length);

      const direction = Number(inputRef.current.down) - Number(inputRef.current.up);
      const targetVelocity =
        direction * rules.maxVerticalSpeed * 0.65;
      model.velocityY +=
        (targetVelocity - model.velocityY) * Math.min(1, dt * 5);
      model.velocityY += rules.gravity * dt;
      model.velocityY = Math.max(
        -rules.maxVerticalSpeed,
        Math.min(rules.maxVerticalSpeed, model.velocityY)
      );

      model.y += model.velocityY * dt;
      model.y = Math.max(MIN_Y, Math.min(MAX_Y, model.y));
      if ((model.y === MIN_Y && model.velocityY < 0) || (model.y === MAX_Y && model.velocityY > 0)) {
        model.velocityY = 0;
      }

      model.distance = Math.min(
        rules.goalDistance,
        model.distance + rules.speed * dt
      );
      model.score += rules.speed * dt * 0.7;

      while (model.distance >= model.nextObstacleDistance) {
        const random = nextRandom(model);
        const margin =
          rules.gapHeight / 2 + 54;
        const gapY =
          margin + random * (VIEW_HEIGHT - margin * 2);

        model.objects.push({
          id: model.seed,
          kind: "obstacle",
          x: VIEW_WIDTH + 70,
          gapY,
          gapHeight: rules.gapHeight,
          style: currentLevel.obstacleStyle,
        });

        model.nextObstacleDistance +=
          Math.max(180, rules.speed * (rules.spawnInterval / 1000));
      }

      while (model.distance >= model.nextStarDistance) {
        const random = nextRandom(model);
        const y = 80 + random * (VIEW_HEIGHT - 160);
        model.objects.push({
          id: model.seed,
          kind: "star",
          x: VIEW_WIDTH + 55,
          y,
        });
        model.nextStarDistance +=
          Math.max(170, rules.speed * (rules.starInterval / 1000));
      }

      const objectMovement = rules.speed * dt;
      for (const object of model.objects) {
        object.x -= objectMovement;
      }

      const hitTime = timestamp;
      if (hitTime >= model.invulnerableUntil) {
        const hitObstacle = model.objects.find(
          (object): object is Extract<FlyObject, { kind: "obstacle" }> =>
            object.kind === "obstacle" && obstacleHitsPlayer(model.y, object)
        );

        if (hitObstacle) {
          model.lives -= 1;
          model.combo = 0;
          model.score = Math.max(0, model.score - rules.collisionPenalty);
          model.invulnerableUntil = timestamp + 1400;
          model.y = VIEW_HEIGHT / 2;
          model.velocityY = 0;
          onSoundRef.current("miss");

          if (model.lives <= 0) {
            model.gameOver = true;
            const gameOverSnapshot = snapshotFromModel(model);
            setSnapshot(gameOverSnapshot);
            onHudRef.current(hudFromSnapshot(gameOverSnapshot, levels.length));
            if (!completedRef.current) {
              completedRef.current = true;
              onSoundRef.current("gameOver");
              setFeedback("انتهت محاولات الهلال. أعد الجولة وحاول مرة أخرى.");
              onResultRef.current(
                hudFromSnapshot(gameOverSnapshot, levels.length)
              );
            }
            return;
          }

          setFeedback(
            "اصطدم الهلال بحاجز. بقي " +
              String(model.lives) +
              " محاولات، ويمكنك متابعة الرحلة."
          );
        }
      }

      const collectedIds = new Set<number>();
      for (const object of model.objects) {
        if (
          object.kind === "star" &&
          circleHit(
            PLAYER_X,
            model.y,
            HITBOX / 2 + 5,
            object.x - 14,
            object.y - 14,
            28,
            28
          )
        ) {
          collectedIds.add(object.id);
          model.collectibles += 1;
          model.combo += 1;
          model.score +=
            rules.starReward + Math.min(120, model.combo * 12);
          onSoundRef.current("collect");
          setFeedback("نجمة مضيئة! واصل طريق الهلال.");
        }
      }

      model.objects = model.objects.filter(
        object =>
          !collectedIds.has(object.id) &&
          object.x > -100
      );

      const nextLevelIndex = Math.min(
        levels.length - 1,
        Math.floor(model.distance / levelDistance)
      );

      if (nextLevelIndex !== model.levelIndex) {
        while (model.completedLevelCount < nextLevelIndex) {
          model.completedLevelCount += 1;
          model.score += rules.levelBonus;
        }
        model.levelIndex = nextLevelIndex;
        model.y = VIEW_HEIGHT / 2;
        model.velocityY = 0;
        onSoundRef.current("success");
        setFeedback("وصلت إلى " + currentLevel.titleAr + ". المرحلة التالية بدأت.");
      }

      if (model.distance >= rules.goalDistance && !model.completed) {
        model.completed = true;
        model.levelIndex = levels.length - 1;
        model.completedLevelCount = levels.length;
        model.score += rules.completionBonus;

        const finalSnapshot = snapshotFromModel(model);
        setSnapshot(finalSnapshot);
        onHudRef.current(hudFromSnapshot(finalSnapshot, levels.length));

        if (!completedRef.current) {
          completedRef.current = true;
          onSoundRef.current("success");
          setFeedback("أتممت رحلة الهلال كاملة. أحسنت!");
          onResultRef.current(
            hudFromSnapshot(finalSnapshot, levels.length)
          );
        }
        return;
      }

      const nextSnapshot = snapshotFromModel(model);
      setSnapshot(nextSnapshot);
      onHudRef.current(hudFromSnapshot(nextSnapshot, levels.length));
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      lastFrameRef.current = null;
    };
  }, [difficulty, levels, restartToken]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowup" || key === "w") {
        inputRef.current.up = true;
        event.preventDefault();
      }
      if (key === "arrowdown" || key === "s") {
        inputRef.current.down = true;
        event.preventDefault();
      }
    };

    const keyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowup" || key === "w") inputRef.current.up = false;
      if (key === "arrowdown" || key === "s") inputRef.current.down = false;
    };

    window.addEventListener("keydown", keyDown, { passive: false });
    window.addEventListener("keyup", keyUp);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  const setControl = (direction: "up" | "down", active: boolean) => {
    inputRef.current[direction] = active;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    touchStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || pausedRef.current) return;

    const dy = event.clientY - start.y;
    if (Math.abs(dy) < 20) return;
    setControl(dy < 0 ? "up" : "down", true);
    window.setTimeout(() => setControl(dy < 0 ? "up" : "down", false), 140);
  };

  const level = levels[snapshot.levelIndex] ?? levels[levels.length - 1];
  const progress = Math.min(
    100,
    Math.round((snapshot.distance / rules.goalDistance) * 100)
  );
  const levelProgress =
    (snapshot.distance % (rules.goalDistance / levels.length)) /
    (rules.goalDistance / levels.length);

  return (
    <section
      dir="rtl"
      aria-label="طيران الهلال"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[#06131f] p-4 shadow-2xl shadow-black/20 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-gold/80">
            HILAL FLY
          </p>
          <h3 className="mt-1 text-2xl font-black text-brand-cream">
            طيران الهلال
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/65">
            {level.subtitleAr} حرّك الهلال رأسيًا، مر عبر الممر، واجمع النجوم
            المضيئة.
          </p>
        </div>

        <div className="min-w-56 rounded-2xl border border-brand-cream/10 bg-black/20 p-4">
          <div className="flex items-center justify-between text-xs text-brand-cream/50">
            <span>تقدم الرحلة</span>
            <strong className="text-brand-gold">{progress}%</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-gold transition-[width] duration-150"
              style={{ width: progress + "%" }}
            />
          </div>
          <div className="mt-3 text-xs text-brand-cream/45">
            المرحلة {snapshot.levelIndex + 1} / {levels.length} · {Math.round(levelProgress * 100)}%
          </div>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          ["النقاط", snapshot.score, "text-brand-gold"],
          ["النجوم", snapshot.collectibles, "text-brand-emerald"],
          ["السلسلة", snapshot.combo, "text-brand-cream"],
          ["المحاولات", snapshot.lives, "text-sky-200"],
          ["المسافة", snapshot.distance, "text-violet-200"],
          ["المستوى", String(snapshot.levelIndex + 1) + "/" + String(levels.length), "text-amber-200"],
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
        className="relative mx-auto h-[520px] max-w-3xl touch-none overflow-hidden rounded-3xl border border-brand-gold/15"
        style={{
          background:
            "radial-gradient(circle at 78% 18%, " +
            level.accent +
            "44, transparent 20%), linear-gradient(160deg, " +
            level.backgroundA +
            ", " +
            level.backgroundB +
            ")",
        }}
        role="application"
        aria-label="سماء طيران الهلال"
      >
        {BACKDROP_STARS.map(([left, top], index) => (
          <span
            key={String(index)}
            className="pointer-events-none absolute select-none text-xs text-white/50"
            style={{
              left: String(left) + "%",
              top: String(top) + "%",
            }}
          >
            {index % 3 === 0 ? "✦" : "·"}
          </span>
        ))}

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-50"
          style={{
            background:
              "linear-gradient(180deg, " +
              level.accent +
              "26, transparent)",
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,#020b14cc)]" />

        {snapshot.objects.map(object => {
          if (object.kind === "star") {
            return (
              <div
                key={"star-" + String(object.id)}
                className="absolute z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-white/80 bg-brand-gold text-lg text-[#513f08] shadow-lg shadow-brand-gold/20"
                style={{
                  left:
                    String((object.x / VIEW_WIDTH) * 100) + "%",
                  top: String(object.y) + "px",
                  transform: "translate(-50%, -50%)",
                }}
                aria-hidden="true"
              >
                ★
              </div>
            );
          }

          const topHeight = object.gapY - object.gapHeight / 2;
          const bottomTop = object.gapY + object.gapHeight / 2;
          return (
            <div
              key={"obstacle-" + String(object.id)}
              className="absolute z-10"
              style={{
                left: String((object.x / VIEW_WIDTH) * 100) + "%",
                top: 0,
                bottom: 0,
                width: "88px",
                transform: "translateX(-50%)",
              }}
              aria-hidden="true"
            >
              <div
                className={obstacleClass(object.style)}
                style={{
                  height: String(Math.max(0, topHeight)) + "px",
                }}
              >
                <div className="grid h-full place-items-center text-2xl text-white/60">
                  {object.style === "lantern"
                    ? "✧"
                    : object.style === "crystal"
                      ? "◆"
                      : object.style === "gate"
                        ? "⌁"
                        : object.style === "arch"
                          ? "⌂"
                          : "☁"}
                </div>
              </div>
              <div
                className="mt-auto"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: String(Math.max(0, VIEW_HEIGHT - bottomTop)) + "px",
                }}
              >
                <div
                  className={obstacleClass(object.style)}
                  style={{ height: "100%" }}
                >
                  <div className="grid h-full place-items-center text-2xl text-white/60">
                    {object.style === "lantern"
                      ? "✧"
                      : object.style === "crystal"
                        ? "◆"
                        : object.style === "gate"
                          ? "⌁"
                          : object.style === "arch"
                            ? "⌂"
                            : "☁"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div
          className={[
            "absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-75 ease-out",
            snapshot.invulnerable ? "opacity-55" : "opacity-100",
          ].join(" ")}
          style={{
            left: String((PLAYER_X / VIEW_WIDTH) * 100) + "%",
            top: String(snapshot.y) + "px",
            width: String(PLAYER_SIZE) + "px",
            height: String(PLAYER_SIZE) + "px",
          }}
          aria-label="الهلال"
        >
          <svg
            viewBox="0 0 72 72"
            className="h-full w-full drop-shadow-[0_0_12px_rgba(243,201,105,0.35)]"
            role="img"
            aria-label="هلال ذهبي"
          >
            <path
              d="M47 7C27 11 14 27 14 44c0 14 10 23 24 23 12 0 23-8 28-20-6 5-12 7-19 7-13 0-22-8-22-20 0-10 8-20 22-27z"
              fill={level.accent}
            />
            <circle
              cx="46"
              cy="52"
              r="3"
              fill="#fff7dc"
              opacity="0.8"
            />
          </svg>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-center gap-3 bg-black/25 px-4 py-4 backdrop-blur-sm">
          <button
            type="button"
            onPointerDown={event => {
              event.preventDefault();
              setControl("up", true);
            }}
            onPointerUp={() => setControl("up", false)}
            onPointerCancel={() => setControl("up", false)}
            onPointerLeave={() => setControl("up", false)}
            disabled={snapshot.completed || snapshot.gameOver}
            className="min-h-14 min-w-20 rounded-2xl border border-brand-gold/30 bg-black/20 px-5 text-2xl text-brand-cream hover:border-brand-gold disabled:opacity-40"
            aria-label="الطيران لأعلى"
          >
            ↑
          </button>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-xs leading-6 text-brand-cream/55">
            اسحب لأعلى أو لأسفل
            <br />
            أو استخدم ↑ ↓
          </div>

          <button
            type="button"
            onPointerDown={event => {
              event.preventDefault();
              setControl("down", true);
            }}
            onPointerUp={() => setControl("down", false)}
            onPointerCancel={() => setControl("down", false)}
            onPointerLeave={() => setControl("down", false)}
            disabled={snapshot.completed || snapshot.gameOver}
            className="min-h-14 min-w-20 rounded-2xl border border-brand-gold/30 bg-black/20 px-5 text-2xl text-brand-cream hover:border-brand-gold disabled:opacity-40"
            aria-label="الطيران لأسفل"
          >
            ↓
          </button>
        </div>

        {(snapshot.completed || snapshot.gameOver) && (
          <div className="absolute inset-0 z-40 grid place-items-center bg-[#030a12]/85 p-5 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-brand-gold/25 bg-[#0a1824] p-6 text-center shadow-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-brand-gold/80">
                HILAL FLY
              </p>
              <h4 className="mt-2 text-3xl font-black text-brand-cream">
                {snapshot.completed ? "أتممت رحلة الهلال!" : "انتهت المحاولات"}
              </h4>
              <p className="mt-3 text-sm leading-7 text-brand-cream/60">
                {snapshot.completed
                  ? "وصلت إلى الفجر الذهبي وجمعت " +
                    String(snapshot.collectibles) +
                    " نجمة."
                  : "يمكنك إعادة الجولة والبدء من المرحلة الأولى."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="block text-xs text-brand-cream/45">النقاط</span>
                  <strong className="mt-1 block text-xl text-brand-gold">
                    {snapshot.score}
                  </strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="block text-xs text-brand-cream/45">النجوم</span>
                  <strong className="mt-1 block text-xl text-brand-emerald">
                    {snapshot.collectibles}
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

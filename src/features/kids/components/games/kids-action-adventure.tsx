"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";
import {
  Cloud,
  GameToast,
  KidsGameHeader,
  KidsGameHud,
  KidsGameStage,
  KidsProgress,
  KidCharacter,
  Moon,
  MosqueBackdrop,
  StarToken,
} from "@/features/kids/components/games/kids-game-kit";
import {
  getZikrJumpLevels,
  getZikrJumpRules,
} from "@/lib/games/zikr-jump";
import {
  getHilalFlyLevels,
  getHilalFlyRules,
} from "@/lib/games/hilal-fly";
import {
  getMosqueAdventureRules,
} from "@/lib/games/mosque-adventure";
import {
  getApprovedScenarioQuestions,
  type VerifiedQuizQuestion,
} from "@/lib/games/verified-content";
import { getKidsLevelMeta } from "@/lib/games/kids-level-system";

export type AdventureGameProps = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

type JumpPlayer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  coyote: number;
};

type JumpSnapshot = {
  levelIndex: number;
  player: JumpPlayer;
  cameraY: number;
  score: number;
  stars: number;
  combo: number;
  lives: number;
  gameOver: boolean;
  completed: boolean;
  collected: string[];
};

const JUMP_WORLD_WIDTH = 760;
const JUMP_VIEW_HEIGHT = 500;
const JUMP_PLAYER_W = 58;
const JUMP_PLAYER_H = 72;

function jumpHud(snapshot: JumpSnapshot, totalLevels: number, completed: boolean): WorldHud {
  return {
    score: snapshot.score,
    collectibles: snapshot.stars,
    distance: Math.max(0, Math.round(2080 - snapshot.player.y)),
    combo: snapshot.combo,
    level: Math.min(totalLevels, snapshot.levelIndex + 1),
    completed,
  };
}

export function ZikrJumpGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: AdventureGameProps) {
  const rules = useMemo(() => getZikrJumpRules(difficulty), [difficulty]);
  const levels = useMemo(() => getZikrJumpLevels(difficulty), [difficulty]);
  const renderClockRef = useRef(0);
  const createInitialJumpState = (): JumpSnapshot => ({
    levelIndex: 0,
    player: {
      x: levels[0].platforms[0].x,
      y: levels[0].platforms[0].y - JUMP_PLAYER_H / 2,
      vx: 0,
      vy: 0,
      grounded: true,
      coyote: 0,
    },
    cameraY: 0,
    score: 0,
    stars: 0,
    combo: 0,
    lives: rules.lives,
    gameOver: false,
    completed: false,
    collected: [],
  });
  const stateRef = useRef<JumpSnapshot>(createInitialJumpState());
  const inputRef = useRef({ left: false, right: false, jump: false });
  const [snapshot, setSnapshot] = useState<JumpSnapshot>(createInitialJumpState);
  const [feedback, setFeedback] = useState("تحرك يمينًا ويسارًا، اقفز، واجمع النجوم.");
  const completeRef = useRef(false);

  const restart = () => {
    const first = levels[0].platforms[0];
    const next: JumpSnapshot = {
      levelIndex: 0,
      player: {
        x: first.x,
        y: first.y - JUMP_PLAYER_H / 2,
        vx: 0,
        vy: 0,
        grounded: true,
        coyote: 0,
      },
      cameraY: 0,
      score: 0,
      stars: 0,
      combo: 0,
      lives: rules.lives,
      gameOver: false,
      completed: false,
      collected: [],
    };
    stateRef.current = next;
    setSnapshot({ ...next, player: { ...next.player }, collected: [] });
    setFeedback("تحرك يمينًا ويسارًا، اقفز، واجمع النجوم.");
    completeRef.current = false;
    inputRef.current = { left: false, right: false, jump: false };
    onHud(jumpHud(next, levels.length, false));
  };

  useEffect(() => {
    restart();
    // Difficulty and restart token define the complete physics configuration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, restartToken, rules, levels]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") {
        inputRef.current.left = true;
        event.preventDefault();
      }
      if (key === "arrowright" || key === "d") {
        inputRef.current.right = true;
        event.preventDefault();
      }
      if (key === " " || key === "arrowup" || key === "w") {
        inputRef.current.jump = true;
        event.preventDefault();
      }
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowleft" || key === "a") inputRef.current.left = false;
      if (key === "arrowright" || key === "d") inputRef.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let previousTime: number | null = null;

    const tick = (timestamp: number) => {
      frame = requestAnimationFrame(tick);
      const state = stateRef.current;
      if (paused || state.completed || state.gameOver) return;

      const dt = Math.min(0.032, Math.max(0.008, ((timestamp - (previousTime ?? timestamp)) / 1000)));
      previousTime = timestamp;
      const level = levels[state.levelIndex];
      const player = state.player;

      const direction = Number(inputRef.current.right) - Number(inputRef.current.left);
      player.vx += (direction * rules.horizontalSpeed - player.vx) * Math.min(1, dt * 9);
      player.x += player.vx * dt;
      player.x = Math.max(JUMP_PLAYER_W / 2 + 14, Math.min(JUMP_WORLD_WIDTH - JUMP_PLAYER_W / 2 - 14, player.x));

      if (inputRef.current.jump) {
        inputRef.current.jump = false;
        if (player.grounded || player.coyote > 0) {
          player.vy = -rules.jumpVelocity;
          player.grounded = false;
          player.coyote = 0;
          onSound("jump");
        }
      }

      const previousBottom = player.y + JUMP_PLAYER_H / 2;
      const previousY = player.y;
      player.vy += rules.gravity * dt;
      player.y += player.vy * dt;
      player.grounded = false;

      for (const platform of level.platforms) {
        const left = platform.x - platform.width / 2;
        const right = platform.x + platform.width / 2;
        const playerLeft = player.x - JUMP_PLAYER_W / 2;
        const playerRight = player.x + JUMP_PLAYER_W / 2;
        const currentBottom = player.y + JUMP_PLAYER_H / 2;
        if (
          player.vy >= 0 &&
          previousBottom <= platform.y &&
          currentBottom >= platform.y &&
          playerRight > left &&
          playerLeft < right
        ) {
          player.y = platform.y - JUMP_PLAYER_H / 2;
          player.vy = 0;
          player.grounded = true;
          player.coyote = 0.12;
          break;
        }
      }

      if (!player.grounded) player.coyote = Math.max(0, player.coyote - dt);

      if (difficulty !== "easy") {
        for (const hazard of level.hazards) {
          const platform = level.platforms[hazard.platformIndex];
          if (!platform) continue;
          const hazardX = platform.x + hazard.offset;
          if (Math.hypot(player.x - hazardX, player.y - (platform.y - 24)) < 34) {
            state.lives -= 1;
            state.combo = 0;
            state.score = Math.max(0, state.score - rules.hazardPenalty);
            player.x = level.platforms[0].x;
            player.y = level.platforms[0].y - JUMP_PLAYER_H / 2;
            player.vx = 0;
            player.vy = 0;
            onSound("miss");
            setFeedback(state.lives > 0 ? "انتبه للعائق وعد للمنصة بأمان." : "انتهت المحاولات. خذ استراحة وحاول مجددًا.");
            if (state.lives <= 0) {
              state.gameOver = true;
              const finalHud = jumpHud(state, levels.length, false);
              setSnapshot({ ...state, player: { ...state.player }, collected: [...state.collected] });
              onHud(finalHud);
              if (!completeRef.current) {
                completeRef.current = true;
                onResult(finalHud);
              }
              return;
            }
          }
        }
      }

      for (let index = 0; index < level.stars.length; index += 1) {
        const star = level.stars[index];
        const id = state.levelIndex + ":" + index;
        if (state.collected.includes(id)) continue;
        if (Math.hypot(player.x - star.x, player.y - star.y) < 42) {
          state.collected.push(id);
          state.stars += 1;
          state.combo += 1;
          state.score += rules.starReward + Math.min(80, state.combo * 8);
          onSound("collect");
          setFeedback("نجمة! الهبوط التالي أصبح أقرب.");
        }
      }

      const goal = level.platforms[level.goalPlatformIndex];
      if (
        goal &&
        player.grounded &&
        player.x > goal.x - goal.width / 2 &&
        player.x < goal.x + goal.width / 2 &&
        previousY > goal.y
      ) {
        if (state.levelIndex + 1 >= levels.length) {
          state.completed = true;
          state.score += rules.completionBonus;
          const finalHud = jumpHud(state, levels.length, true);
          setSnapshot({ ...state, player: { ...state.player }, collected: [...state.collected] });
          onHud(finalHud);
          if (!completeRef.current) {
            completeRef.current = true;
            onSound("success");
            setFeedback("أكملت جميع مستويات قفزة ذِكر.");
            onResult(finalHud);
          }
          return;
        }

        state.levelIndex += 1;
        state.score += rules.levelBonus;
        state.combo += 1;
        const nextStart = levels[state.levelIndex].platforms[0];
        player.x = nextStart.x;
        player.y = nextStart.y - JUMP_PLAYER_H / 2;
        player.vx = 0;
        player.vy = 0;
        state.cameraY = 0;
        onSound("success");
        setFeedback("وصلت إلى " + levels[state.levelIndex].titleAr + ".");
      }

      state.cameraY = Math.max(0, player.y - 230);
      if (player.y > state.cameraY + JUMP_VIEW_HEIGHT + 150) {
        state.lives -= 1;
        state.combo = 0;
        player.x = level.platforms[0].x;
        player.y = level.platforms[0].y - JUMP_PLAYER_H / 2;
        player.vx = 0;
        player.vy = 0;
        onSound("miss");
        setFeedback(state.lives > 0 ? "سقطت من الطريق. عد للمحاولة بهدوء." : "انتهت المحاولات في هذه الجولة.");
        if (state.lives <= 0) {
          state.gameOver = true;
          const finalHud = jumpHud(state, levels.length, false);
          setSnapshot({ ...state, player: { ...state.player }, collected: [...state.collected] });
          onHud(finalHud);
          if (!completeRef.current) {
            completeRef.current = true;
            onResult(finalHud);
          }
          return;
        }
      }

      if (timestamp - renderClockRef.current >= 50) {
        renderClockRef.current = timestamp;
        const snapshotNext = { ...state, player: { ...state.player }, collected: [...state.collected] };
        setSnapshot(snapshotNext);
        onHud(jumpHud(snapshotNext, levels.length, false));
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      previousTime = null;
    };
  }, [difficulty, levels, onHud, onResult, onSound, paused, rules]);

  const level = levels[snapshot.levelIndex];
  const percent = level ? Math.min(100, Math.round((1 - (snapshot.player.y - (level.platforms[level.goalPlatformIndex]?.y ?? 0)) / 1700) * 100)) : 0;

  return (
    <KidsGameStage theme={level.theme === "garden" ? "garden" : level.theme === "courtyard" ? "mosque" : level.theme === "dawn" ? "dawn" : "night"} ariaLabel="قفزة ذِكر">
      <KidsGameHeader
        eyebrow="ZIKR JUMP"
        title="قفزة ذِكر"
        description={level.subtitleAr}
        right={<div className="hidden w-52 sm:block"><KidsProgress value={percent} label="ارتفاع المرحلة" /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "المرحلة", value: (snapshot.levelIndex + 1) + "/" + levels.length, tone: "text-violet-200" },
            { label: "النقاط", value: snapshot.score, tone: "text-brand-gold" },
            { label: "النجوم", value: snapshot.stars, tone: "text-brand-emerald" },
            { label: "السلسلة", value: snapshot.combo, tone: "text-brand-cream" },
            { label: "المحاولات", value: snapshot.lives, tone: "text-sky-200" },
          ]}
        />
      </div>

      <div className="relative mx-4 mt-4 h-[500px] overflow-hidden rounded-[2rem] border border-white/10 sm:mx-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#f3c96920,transparent_25%),linear-gradient(180deg,#0e2a3a,#07151e)]" />
        <Cloud left={8} top={19} scale={0.9} />
        <Cloud left={57} top={12} scale={1.15} />
        <Cloud left={77} top={38} scale={0.7} />

        {level.platforms.map((platform, index) => {
          const y = platform.y - snapshot.cameraY;
          if (y < -60 || y > JUMP_VIEW_HEIGHT + 60) return null;
          const goal = index === level.goalPlatformIndex;
          return (
            <div
              key={index}
              className={
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 " +
                (goal
                  ? "border-brand-gold bg-brand-gold/30 shadow-[0_0_28px_rgba(243,201,105,.2)]"
                  : "border-brand-emerald/50 bg-brand-emerald/20")
              }
              style={{
                left: (platform.x / JUMP_WORLD_WIDTH) * 100 + "%",
                top: y,
                width: (platform.width / JUMP_WORLD_WIDTH) * 100 + "%",
                height: 20,
              }}
            >
              {goal && <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-brand-gold">✦</span>}
            </div>
          );
        })}

        {level.stars.map((star, index) => {
          const id = snapshot.levelIndex + ":" + index;
          if (snapshot.collected.includes(id)) return null;
          const y = star.y - snapshot.cameraY;
          if (y < -40 || y > JUMP_VIEW_HEIGHT + 40) return null;
          return (
            <div key={id} className="absolute" style={{ left: (star.x / JUMP_WORLD_WIDTH) * 100 + "%", top: y, transform: "translate(-50%,-50%)" }}>
              <StarToken size={36} pulse />
            </div>
          );
        })}

        {difficulty !== "easy" &&
          level.hazards.map((hazard, index) => {
            const platform = level.platforms[hazard.platformIndex];
            if (!platform) return null;
            const y = platform.y - snapshot.cameraY - 24;
            if (y < -40 || y > JUMP_VIEW_HEIGHT + 40) return null;
            return (
              <div
                key={"hazard-" + index}
                className="absolute grid h-9 w-14 place-items-center rounded-xl border-2 border-rose-200/40 bg-rose-200/10 text-rose-100"
                style={{
                  left: ((platform.x + hazard.offset) / JUMP_WORLD_WIDTH) * 100 + "%",
                  top: y,
                  transform: "translate(-50%,-50%)",
                }}
              >
                !
              </div>
            );
          })}

        <div
          className="absolute z-20"
          style={{
            left: (snapshot.player.x / JUMP_WORLD_WIDTH) * 100 + "%",
            top: snapshot.player.y - snapshot.cameraY,
            transform: "translate(-50%,-50%)",
          }}
        >
          <KidCharacter state={snapshot.gameOver ? "hit" : snapshot.completed ? "celebrate" : snapshot.player.vy < -40 ? "jump" : "run"} variant="runner" size={70} />
        </div>

        <div className="absolute bottom-0 inset-x-0 z-40 grid grid-cols-3 gap-3 border-t border-white/10 bg-black/25 p-4 backdrop-blur-md">
          <button type="button" onPointerDown={() => (inputRef.current.left = true)} onPointerUp={() => (inputRef.current.left = false)} onPointerCancel={() => (inputRef.current.left = false)} className="min-h-14 rounded-2xl border border-white/10 bg-black/20 text-2xl text-brand-cream">←</button>
          <button type="button" onPointerDown={() => (inputRef.current.jump = true)} className="min-h-14 rounded-2xl border-2 border-brand-gold/40 bg-brand-gold/10 text-sm font-black text-brand-gold">قفز</button>
          <button type="button" onPointerDown={() => (inputRef.current.right = true)} onPointerUp={() => (inputRef.current.right = false)} onPointerCancel={() => (inputRef.current.right = false)} className="min-h-14 rounded-2xl border border-white/10 bg-black/20 text-2xl text-brand-cream">→</button>
        </div>
      </div>
      <GameToast tone={snapshot.gameOver ? "rose" : snapshot.completed ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type FlyObject =
  | { id: number; kind: "obstacle"; x: number; gapY: number; gap: number; style: "cloud" | "gate" | "lantern" | "arch" | "crystal" | "gold" }
  | { id: number; kind: "star"; x: number; y: number };

type FlyState = {
  y: number;
  vy: number;
  distance: number;
  score: number;
  stars: number;
  combo: number;
  lives: number;
  objects: FlyObject[];
  nextObstacle: number;
  nextStar: number;
  levelIndex: number;
  completed: boolean;
  gameOver: boolean;
  invulnerableUntil: number;
  seed: number;
};

const FLY_WIDTH = 760;
const FLY_HEIGHT = 500;
const FLY_X = 150;

function flyHud(state: FlyState, levels: number): WorldHud {
  return {
    score: Math.max(0, Math.floor(state.score)),
    collectibles: state.stars,
    distance: Math.floor(state.distance),
    combo: state.combo,
    level: Math.min(levels, state.levelIndex + 1),
    completed: state.completed,
  };
}

function flyObstacleHit(y: number, object: Extract<FlyObject, { kind: "obstacle" }>) {
  if (Math.abs(object.x - FLY_X) > 62) return false;
  const top = object.gapY - object.gap / 2;
  const bottom = object.gapY + object.gap / 2;
  return y < top + 22 || y > bottom - 22;
}

export function HilalFlyGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: AdventureGameProps) {
  const rules = useMemo(() => getHilalFlyRules(difficulty), [difficulty]);
  const levels = useMemo(() => getHilalFlyLevels(difficulty), [difficulty]);
  const renderClockRef = useRef(0);
  const create = (): FlyState => ({
    y: FLY_HEIGHT / 2,
    vy: 0,
    distance: 0,
    score: 0,
    stars: 0,
    combo: 0,
    lives: rules.lives,
    objects: [],
    nextObstacle: 320,
    nextStar: 190,
    levelIndex: 0,
    completed: false,
    gameOver: false,
    invulnerableUntil: 0,
    seed: levels[0].id.length * 97 + 12,
  });
  const stateRef = useRef<FlyState>(create());
  const [state, setState] = useState<FlyState>(() => create());
  const inputRef = useRef({ up: false, down: false });
  const completionRef = useRef(false);
  const [feedback, setFeedback] = useState("حرّك الهلال لأعلى ولأسفل في السماء.");
  const [swipe, setSwipe] = useState<{ x: number; y: number } | null>(null);

  const reset = () => {
    const next = create();
    stateRef.current = next;
    setState(next);
    inputRef.current = { up: false, down: false };
    completionRef.current = false;
    setFeedback("حرّك الهلال لأعلى ولأسفل في السماء.");
    onHud(flyHud(next, levels.length));
  };

  useEffect(() => {
    reset();
    // Difficulty drives every flight parameter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, restartToken, rules, levels]);

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
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let previous: number | null = null;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      const state = stateRef.current;
      if (paused || state.completed || state.gameOver) return;
      const dt = Math.min(0.032, Math.max(0.008, (time - (previous ?? time)) / 1000));
      previous = time;

      const direction = Number(inputRef.current.down) - Number(inputRef.current.up);
      const target = direction * rules.maxVerticalSpeed * 0.62;
      state.vy += (target - state.vy) * Math.min(1, dt * 5);
      state.vy += rules.gravity * dt * 0.34;
      state.vy = Math.max(-rules.maxVerticalSpeed, Math.min(rules.maxVerticalSpeed, state.vy));
      state.y += state.vy * dt;
      state.y = Math.max(48, Math.min(FLY_HEIGHT - 92, state.y));

      const stageDistance = rules.goalDistance / levels.length;
      const nextLevel = Math.min(levels.length - 1, Math.floor(state.distance / Math.max(1, stageDistance)));
      const levelMeta = getKidsLevelMeta("hilal-fly", difficulty, nextLevel);
      const level = levels[nextLevel];
      const stageSpeed = rules.speed * (0.9 + levelMeta.pace * 0.06);
      state.distance = Math.min(rules.goalDistance, state.distance + stageSpeed * dt);
      state.score += stageSpeed * dt * 0.62;

      if (nextLevel !== state.levelIndex) {
        state.levelIndex = nextLevel;
        state.objects = [];
        state.nextObstacle = state.distance + Math.max(180, rules.speed * (rules.spawnInterval / 1000) * (1.02 - levelMeta.density * 0.03));
        state.nextStar = state.distance + Math.max(150, rules.speed * (rules.starInterval / 1000));
        state.combo = 0;
        onSound("success");
        setFeedback("دخلت " + level.titleAr + ".");
      }

      const gap = Math.max(110, rules.gapHeight * level.gapScale);
      while (state.distance >= state.nextObstacle) {
        const margin = gap / 2 + 60;
        const random = state.seed / 4294967296;
        const gapY = margin + random * (FLY_HEIGHT - margin * 2);
        state.objects.push({
          id: state.seed,
          kind: "obstacle",
          x: FLY_WIDTH + 50,
          gapY,
          gap,
          style: level.obstacleStyle,
        });
        state.nextObstacle += Math.max(190, stageSpeed * (rules.spawnInterval / 1000));
        state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
      }
      while (state.distance >= state.nextStar) {
        const random = state.seed / 4294967296;
        state.objects.push({
          id: state.seed + 1,
          kind: "star",
          x: FLY_WIDTH + 40,
          y: 70 + random * (FLY_HEIGHT - 150),
        });
        state.nextStar += Math.max(160, stageSpeed * (rules.starInterval / 1000));
        state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
      }

      for (const item of state.objects) item.x -= stageSpeed * dt;

      if (time >= state.invulnerableUntil) {
        const hit = state.objects.find(item => item.kind === "obstacle" && flyObstacleHit(state.y, item));
        if (hit) {
          state.lives -= 1;
          state.combo = 0;
          state.score = Math.max(0, state.score - rules.collisionPenalty);
          state.invulnerableUntil = time + 1300;
          state.y = FLY_HEIGHT / 2;
          state.vy = 0;
          onSound("miss");
          setFeedback(state.lives > 0 ? "حافظ على ارتفاع الهلال وواصل." : "انتهت محاولات الطيران.");
          if (state.lives <= 0) {
            state.gameOver = true;
            const finalHud = flyHud(state, levels.length);
            setState({ ...state, objects: [...state.objects] });
            onHud(finalHud);
            if (!completionRef.current) {
              completionRef.current = true;
              onSound("gameOver");
              onResult(finalHud);
            }
            return;
          }
        }
      }

      const collected = new Set<number>();
      for (const item of state.objects) {
        if (item.kind === "star" && Math.hypot(item.x - FLY_X, item.y - state.y) < 34) {
          collected.add(item.id);
          state.stars += 1;
          state.combo += 1;
          state.score += rules.starReward + Math.min(100, state.combo * 10);
          onSound("collect");
          setFeedback("نجمة من السماء!.");
        }
      }

      state.objects = state.objects.filter(item => !collected.has(item.id) && item.x > -100);

      if (state.distance >= rules.goalDistance) {
        state.completed = true;
        state.score += rules.completionBonus;
        const finalHud = flyHud(state, levels.length);
        setState({ ...state, objects: [...state.objects] });
        onHud(finalHud);
        if (!completionRef.current) {
          completionRef.current = true;
          onSound("success");
          setFeedback("وصل الهلال إلى الفجر الذهبي.");
          onResult(finalHud);
        }
        return;
      }

      if (time - renderClockRef.current >= 50) {
        renderClockRef.current = time;
        const nextState = { ...state, objects: [...state.objects] };
        setState(nextState);
        onHud(flyHud(nextState, levels.length));
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      previous = null;
    };
  }, [levels, onHud, onResult, onSound, paused, rules]);

  const level = levels[state.levelIndex];
  const progress = (state.distance / rules.goalDistance) * 100;

  return (
    <KidsGameStage theme="night" ariaLabel="طيران الهلال">
      <KidsGameHeader
        eyebrow="HILAL FLY"
        title="طيران الهلال"
        description={level.subtitleAr}
        right={<div className="hidden w-52 sm:block"><KidsProgress value={progress} label="رحلة السماء" /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: state.score, tone: "text-brand-gold" },
            { label: "النجوم", value: state.stars, tone: "text-brand-emerald" },
            { label: "السلسلة", value: state.combo, tone: "text-violet-200" },
            { label: "المحاولات", value: state.lives, tone: "text-sky-200" },
            { label: "المرحلة", value: (state.levelIndex + 1) + "/" + levels.length, tone: "text-amber-200" },
          ]}
        />
      </div>

      <div
        className="relative mx-4 mt-4 h-[500px] overflow-hidden rounded-[2rem] border border-white/10 sm:mx-6"
        onPointerDown={event => setSwipe({ x: event.clientX, y: event.clientY })}
        onPointerUp={event => {
          if (!swipe) return;
          const dy = event.clientY - swipe.y;
          setSwipe(null);
          inputRef.current.up = dy < -18;
          inputRef.current.down = dy > 18;
          window.setTimeout(() => {
            inputRef.current.up = false;
            inputRef.current.down = false;
          }, 150);
        }}
      >
        <Moon />
        <Cloud left={3} top={34} scale={0.9} tone="light" />
        <Cloud left={60} top={48} scale={1.15} tone="light" />
        <Cloud left={77} top={19} scale={0.7} tone="dark" />

        {state.objects.map(object => {
          if (object.kind === "star") {
            return (
              <div key={object.id} className="absolute z-20" style={{ left: (object.x / FLY_WIDTH) * 100 + "%", top: object.y, transform: "translate(-50%,-50%)" }}>
                <StarToken size={38} pulse />
              </div>
            );
          }
          const topHeight = object.gapY - object.gap / 2;
          const bottomTop = object.gapY + object.gap / 2;
          const icon = object.style === "lantern" ? "✧" : object.style === "crystal" ? "◆" : object.style === "arch" ? "⌂" : object.style === "gate" ? "⌁" : "☁";
          return (
            <div
              key={object.id}
              className="absolute inset-y-0 z-10 w-[82px] -translate-x-1/2"
              style={{ left: (object.x / FLY_WIDTH) * 100 + "%" }}
            >
              <div className="absolute inset-x-0 top-0 rounded-b-[2rem] border-2 border-brand-gold/20 bg-brand-gold/10" style={{ height: Math.max(0, topHeight) }}>
                <div className="grid h-full place-items-center text-2xl text-white/35">{icon}</div>
              </div>
              <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-2 border-brand-emerald/20 bg-brand-emerald/10" style={{ height: Math.max(0, FLY_HEIGHT - bottomTop) }}>
                <div className="grid h-full place-items-center text-2xl text-white/35">{icon}</div>
              </div>
            </div>
          );
        })}

        <div
          className="absolute z-30 transition-[top] duration-75"
          style={{
            left: (FLY_X / FLY_WIDTH) * 100 + "%",
            top: state.y,
            transform: "translate(-50%,-50%)",
            opacity: state.invulnerableUntil > performance.now() ? 0.45 : 1,
          }}
        >
          <KidCharacter variant="explorer" state={state.completed ? "celebrate" : state.gameOver ? "hit" : state.vy < -20 ? "jump" : "idle"} size={78} />
          <div className="absolute inset-0 grid place-items-center text-3xl text-brand-gold" aria-hidden="true">☾</div>
        </div>

        <div className="absolute bottom-0 inset-x-0 z-40 grid grid-cols-2 gap-3 border-t border-white/10 bg-black/25 p-4 backdrop-blur-md">
          <button type="button" onPointerDown={() => (inputRef.current.up = true)} onPointerUp={() => (inputRef.current.up = false)} onPointerCancel={() => (inputRef.current.up = false)} className="min-h-14 rounded-2xl border border-brand-gold/30 bg-brand-gold/10 text-2xl text-brand-gold">↑</button>
          <button type="button" onPointerDown={() => (inputRef.current.down = true)} onPointerUp={() => (inputRef.current.down = false)} onPointerCancel={() => (inputRef.current.down = false)} className="min-h-14 rounded-2xl border border-white/10 bg-black/20 text-2xl text-brand-cream">↓</button>
        </div>
      </div>
      <GameToast>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type AdventureNode = {
  id: string;
  title: string;
  label: string;
  x: number;
  y: number;
  icon: string;
};

const NODE_TEMPLATES = [
  { title: "البوابة", label: "البداية", icon: "⌂" },
  { title: "الساحة", label: "استكشف", icon: "✦" },
  { title: "المكتبة", label: "تعلم", icon: "▤" },
  { title: "الحديقة", label: "تأمل", icon: "✿" },
  { title: "المئذنة", label: "اكتشف", icon: "☾" },
  { title: "ممر النجوم", label: "اجمع", icon: "★" },
  { title: "بوابة النور", label: "النهاية", icon: "✧" },
] as const;

export function MosqueAdventureGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: AdventureGameProps) {
  const rules = useMemo(() => getMosqueAdventureRules(difficulty), [difficulty]);
  const questions = useMemo(() => getApprovedScenarioQuestions(), []);
  const [levelIndex, setLevelIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [question, setQuestion] = useState<VerifiedQuizQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("اضغط على المحطة التالية لاستكشاف الخريطة.");
  const [completed, setCompleted] = useState(false);
  const completionRef = useRef(false);
  const advancingRef = useRef(false);

  const levelMeta = useMemo(() => getKidsLevelMeta("mosque-adventure", difficulty, levelIndex), [difficulty, levelIndex]);
  const stationCount = rules.nodeCount + (levelMeta.pattern % 2);
  const nodes = useMemo<AdventureNode[]>(() => {
    const count = Math.max(5, Math.min(7, stationCount));
    return Array.from({ length: count }, (_, index) => {
      const template = NODE_TEMPLATES[(index + levelMeta.pattern) % NODE_TEMPLATES.length];
      const progress = count <= 1 ? 0.5 : index / (count - 1);
      const sway = ((levelMeta.seed + index * 37) % 13) - 6;
      return {
        id: levelMeta.id + "-" + index,
        title: template.title + " " + (index + 1),
        label: template.label,
        icon: template.icon,
        x: Math.max(8, Math.min(92, 10 + progress * 80)),
        y: Math.max(22, Math.min(78, 72 - progress * 48 + sway)),
      };
    });
  }, [levelMeta.id, levelMeta.pattern, levelMeta.seed, stationCount]);

  const reset = () => {
    setLevelIndex(0);
    setPosition(0);
    setScore(0);
    setStars(0);
    setCombo(0);
    setMistakes(0);
    setQuestion(null);
    setAnswer(null);
    setFeedback("اضغط على المحطة التالية لاستكشاف الخريطة.");
    setCompleted(false);
    completionRef.current = false;
    advancingRef.current = false;
    onHud({ score: 0, collectibles: 0, distance: 0, combo: 0, level: 1, completed: false });
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [difficulty, restartToken]);

  const progress = nodes.length <= 1 ? 100 : (position / (nodes.length - 1)) * 100;

  const visit = (index: number) => {
    if (paused || completed || question) return;
    if (index !== position + 1 || index >= nodes.length) return;

    const nextScore = score + 300;
    const nextStars = stars + 1;
    const nextCombo = combo + 1;
    setPosition(index);
    setStars(nextStars);
    setScore(nextScore);
    setCombo(nextCombo);
    onSound("collect");
    setFeedback("وصلت إلى " + nodes[index].title + ".");

    if (rules.questionStationIndexes.includes(index) && questions.length > 0) {
      const questionIndex = (levelIndex * 2 + index) % questions.length;
      setQuestion(questions[questionIndex]);
      setAnswer(null);
      setFeedback("محطة تعلم: اختر الإجابة ثم واصل الاستكشاف.");
      return;
    }

    if (index === nodes.length - 1 && !advancingRef.current) {
      if (levelIndex + 1 < rules.levelCount) {
        advancingRef.current = true;
        setScore(value => value + 500);
        setFeedback("اكتملت " + levelMeta.titleAr + ". خريطة مختلفة في الطريق...");
        onSound("success");
        window.setTimeout(() => {
          setLevelIndex(value => value + 1);
          setPosition(0);
          setQuestion(null);
          setAnswer(null);
          setCombo(0);
          advancingRef.current = false;
        }, 650);
      } else {
        const finalHud: WorldHud = {
          score: nextScore + 500,
          collectibles: nextStars,
          distance: nodes.length,
          combo: nextCombo,
          level: rules.levelCount,
          completed: true,
        };
        setCompleted(true);
        onHud(finalHud);
        if (!completionRef.current) {
          completionRef.current = true;
          onSound("success");
          setFeedback("أكملت جميع مستويات مغامرة المسجد.");
          onResult(finalHud);
        }
      }
    }
  };

  const answerStation = (index: number) => {
    if (!question || answer !== null) return;
    setAnswer(index);
    const correct = index === question.correctAnswer;
    if (correct) {
      setScore(value => value + 180);
      setCombo(value => value + 1);
      onSound("success");
      setFeedback("إجابة صحيحة. المحطة التالية مفتوحة.");
    } else {
      setMistakes(value => value + 1);
      setCombo(0);
      setScore(value => Math.max(0, value - rules.mistakePenalty));
      onSound("miss");
      setFeedback(rules.mistakePenalty > 0 ? "إجابة غير صحيحة، لكن الرحلة مستمرة." : "إجابة غير صحيحة. لا يوجد خصم في السهل.");
    }
    window.setTimeout(() => {
      setQuestion(null);
      setAnswer(null);
    }, 500);
  };

  useEffect(() => {
    onHud({
      score,
      collectibles: stars,
      distance: position,
      combo,
      level: levelIndex + 1,
      completed,
    });
  }, [combo, completed, levelIndex, onHud, position, score, stars]);

  return (
    <KidsGameStage theme="mosque" ariaLabel="مغامرة المسجد">
      <KidsGameHeader eyebrow="MOSQUE ADVENTURE" title="مغامرة المسجد" description={levelMeta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={progress} label={"المستوى " + (levelIndex + 1) + "/" + rules.levelCount} /></div>} />
      <div className="px-4 sm:px-6">
        <KidsGameHud items={[
          { label: "النقاط", value: score, tone: "text-brand-gold" },
          { label: "المحطات", value: position + "/" + Math.max(1, nodes.length - 1), tone: "text-brand-emerald" },
          { label: "السلسلة", value: combo, tone: "text-violet-200" },
          { label: "الأخطاء", value: mistakes, tone: "text-rose-100" },
          { label: "المستوى", value: (levelIndex + 1) + "/" + rules.levelCount, tone: "text-amber-200" },
        ]} />
      </div>

      <div className="relative mx-4 mt-4 h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#09232f] sm:mx-6">
        <MosqueBackdrop />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-50" preserveAspectRatio="none" aria-hidden="true">
          <path d="M10 72 C25 55 34 62 44 46 S64 48 74 38 S84 31 90 24" fill="none" stroke="#f3c969" strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="3 2" />
          <path d="M10 72 C25 55 34 62 44 46 S64 48 74 38 S84 31 90 24" fill="none" stroke="#5fd1a6" strokeOpacity=".18" strokeWidth="4" />
        </svg>

        {nodes.map((node, index) => {
          const unlocked = index <= position;
          const next = index === position + 1;
          return (
            <button key={node.id} type="button" onClick={() => visit(index)} disabled={!next || paused || Boolean(question) || completed}
              className={[
                "absolute grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[1.6rem] border-2 transition",
                unlocked ? "border-brand-gold/50 bg-brand-gold/10 text-brand-gold shadow-[0_0_34px_rgba(243,201,105,.12)]"
                  : next ? "border-brand-emerald/60 bg-brand-emerald/10 text-brand-emerald animate-pulse"
                  : "border-white/10 bg-black/20 text-brand-cream/35",
              ].join(" ")}
              style={{ left: node.x + "%", top: node.y + "%" }}>
              <span className="text-2xl">{unlocked ? node.icon : "•"}</span>
              <span className="absolute -bottom-8 whitespace-nowrap text-xs text-brand-cream/65">{node.title}</span>
            </button>
          );
        })}

        <div className="absolute z-20 transition-all duration-500" style={{ left: nodes[position]?.x + "%", top: (nodes[position]?.y - 10) + "%", transform: "translate(-50%,-50%)" }}>
          <KidCharacter variant="explorer" state={completed ? "celebrate" : "run"} size={68} />
        </div>

        <div className="absolute bottom-0 inset-x-0 z-30 border-t border-white/10 bg-black/25 p-4 text-center backdrop-blur-md">
          <p className="text-xs text-brand-cream/50">المحطة الحالية</p>
          <p className="mt-1 text-sm font-bold text-brand-gold">{nodes[position]?.label}</p>
        </div>

        {question && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-[#031017]/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl rounded-[2rem] border border-brand-gold/20 bg-[#0a1b25] p-6">
              <p className="text-xs font-black tracking-[0.18em] text-brand-emerald">محطة تعلم</p>
              <h4 className="mt-3 text-2xl font-black text-brand-cream">{question.text}</h4>
              <div className="mt-5 grid gap-3">
                {question.options.map((option, index) => (
                  <button key={option} type="button" disabled={answer !== null} onClick={() => answerStation(index)}
                    className={["rounded-2xl border p-4 text-right", answer === index ? (index === question.correctAnswer ? "border-brand-emerald bg-brand-emerald/15" : "border-rose-300/30 bg-rose-300/10") : answer !== null && index === question.correctAnswer ? "border-brand-emerald/60 bg-brand-emerald/10" : "border-white/10 bg-white/[0.03] hover:border-brand-gold/35"].join(" ")}>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <GameToast tone={completed ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

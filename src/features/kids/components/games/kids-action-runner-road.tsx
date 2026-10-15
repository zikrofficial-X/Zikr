"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";
import { KidsGameWorld } from "@/features/kids/components/games/kids-game-visuals";
import {
  GameToast,
  GardenBackdrop,
  KidsGameHeader,
  KidsGameHud,
  KidsGameStage,
  KidsProgress,
  KidCharacter,
  MosqueBackdrop,
  StarToken,
  TouchArrows,
} from "@/features/kids/components/games/kids-game-kit";
import { getZikrRunnerLevels, getZikrRunnerRules } from "@/lib/games/zikr-runner";
import { getKidsLevelMeta } from "@/lib/games/kids-level-system";
import {
  getApprovedRoadQuestions,
  type VerifiedQuizQuestion,
} from "@/lib/games/verified-content";
import { getZikrRoadRules } from "@/lib/games/zikr-road";
import { gameKeyAction } from "@/lib/games/gameplay-helpers";

export type ActionGameProps = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

type RunnerObject = {
  id: number;
  kind: "hazard" | "star";
  x: number;
  y: number;
  variant: "box" | "cone" | "stone";
};

type RunnerModel = {
  playerY: number;
  velocityY: number;
  grounded: boolean;
  coyote: number;
  distance: number;
  score: number;
  collectibles: number;
  combo: number;
  lives: number;
  objects: RunnerObject[];
  nextHazard: number;
  nextStar: number;
  levelIndex: number;
  checkpointIndex: number;
  questionOpen: boolean;
  completed: boolean;
  gameOver: boolean;
  invulnerableUntil: number;
  seed: number;
};

const RUNNER_WIDTH = 760;
const RUNNER_GROUND = 350;
const RUNNER_PLAYER_X = 155;
const RUNNER_PLAYER_SIZE = 70;

function newRunnerModel(
  rules: ReturnType<typeof getZikrRunnerRules>,
  levels: ReturnType<typeof getZikrRunnerLevels>
): RunnerModel {
  return {
    playerY: RUNNER_GROUND - RUNNER_PLAYER_SIZE / 2,
    velocityY: 0,
    grounded: true,
    coyote: 0,
    distance: 0,
    score: 0,
    collectibles: 0,
    combo: 0,
    lives: rules.lives,
    objects: [],
    nextHazard: 430,
    nextStar: 220,
    levelIndex: 0,
    checkpointIndex: 0,
    questionOpen: false,
    completed: false,
    gameOver: false,
    invulnerableUntil: 0,
    seed: levels[0].id.length * 113 + 19,
  };
}

function nextRunnerRandom(model: RunnerModel) {
  model.seed = (model.seed * 1664525 + 1013904223) >>> 0;
  return model.seed / 4294967296;
}

function runnerHud(model: RunnerModel, levelCount: number): WorldHud {
  return {
    score: Math.max(0, Math.floor(model.score)),
    collectibles: model.collectibles,
    distance: Math.floor(model.distance),
    combo: model.combo,
    level: Math.min(levelCount, model.levelIndex + 1),
    completed: model.completed,
  };
}

function rectOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return (
    Math.abs(ax - bx) * 2 < aw + bw &&
    Math.abs(ay - by) * 2 < ah + bh
  );
}

export function ZikrRunnerGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: ActionGameProps) {
  const rules = useMemo(() => getZikrRunnerRules(difficulty), [difficulty]);
  const levels = useMemo(() => getZikrRunnerLevels(difficulty), [difficulty]);
  const renderClockRef = useRef(0);
  const questions = useMemo(() => getApprovedRoadQuestions(), []);
  const modelRef = useRef<RunnerModel>(newRunnerModel(rules, levels));
  const inputRef = useRef({ jump: false });
  const completionRef = useRef(false);
  const lastFrameRef = useRef<number | null>(null);
  const [model, setModel] = useState(() => newRunnerModel(rules, levels));
  const [question, setQuestion] = useState<VerifiedQuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("اقفز فوق العوائق واجمع نجوم الطريق.");
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);

  const reset = () => {
    const next = newRunnerModel(rules, levels);
    modelRef.current = next;
    setModel(next);
    setQuestion(null);
    setSelectedAnswer(null);
    setFeedback("اقفز فوق العوائق واجمع نجوم الطريق.");
    completionRef.current = false;
    inputRef.current.jump = false;
    lastFrameRef.current = null;
    onHud(runnerHud(next, levels.length));
  };

  useEffect(() => {
    reset();
    // Rules and level sets are stable for each difficulty selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, restartToken, rules, levels]);

  const requestJump = () => {
    if (!paused && !modelRef.current.questionOpen && !modelRef.current.gameOver) {
      inputRef.current.jump = true;
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = gameKeyAction(event);
      if (action === "jump" || action === "up") {
        event.preventDefault();
        requestJump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // requestJump reads refs and props intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    let frame = 0;

    const tick = (timestamp: number) => {
      frame = requestAnimationFrame(tick);
      const previous = lastFrameRef.current ?? timestamp;
      lastFrameRef.current = timestamp;
      const dt = Math.min(0.032, Math.max(0.008, (timestamp - previous) / 1000));
      const state = modelRef.current;

      if (paused || state.questionOpen || state.completed || state.gameOver) return;

      if (inputRef.current.jump) {
        inputRef.current.jump = false;
        if (state.grounded || state.coyote > 0) {
          state.velocityY = -rules.jumpVelocity;
          state.grounded = false;
          state.coyote = 0;
          onSound("jump");
        }
      }

      const previousBottom = state.playerY + RUNNER_PLAYER_SIZE / 2;
      state.velocityY += rules.gravity * dt;
      state.velocityY = Math.min(state.velocityY, 920);
      state.playerY += state.velocityY * dt;
      state.grounded = false;

      if (
        state.velocityY >= 0 &&
        previousBottom <= RUNNER_GROUND &&
        state.playerY + RUNNER_PLAYER_SIZE / 2 >= RUNNER_GROUND
      ) {
        state.playerY = RUNNER_GROUND - RUNNER_PLAYER_SIZE / 2;
        state.velocityY = 0;
        state.grounded = true;
        state.coyote = 0.1;
      } else {
        state.coyote = Math.max(0, state.coyote - dt);
      }

      const activeLevel = levels[state.levelIndex] ?? levels[levels.length - 1];
      const stageSpeed = rules.speed * activeLevel.speedMultiplier;
      state.distance = Math.min(rules.goalDistance, state.distance + stageSpeed * dt);
      state.score += stageSpeed * dt * 0.75;

      const levelSize = rules.goalDistance / levels.length;
      const nextLevelIndex = Math.min(levels.length - 1, Math.floor(state.distance / Math.max(1, levelSize)));
      if (nextLevelIndex !== state.levelIndex) {
        state.levelIndex = nextLevelIndex;
        state.objects = [];
        state.nextHazard = state.distance + Math.max(240, rules.obstacleInterval / activeLevel.hazardMultiplier);
        state.nextStar = state.distance + Math.max(160, rules.starInterval);
        state.combo = Math.max(0, state.combo);
        onSound("success");
        setFeedback("دخلت " + levels[nextLevelIndex].titleAr + ".");
      }

      const hazardGap = Math.max(240, rules.obstacleInterval / Math.max(0.65, activeLevel.hazardMultiplier));
      const starGap = Math.max(160, rules.starInterval + activeLevel.starOffset);
      while (state.distance >= state.nextHazard && state.nextHazard <= rules.goalDistance) {
        const random = nextRunnerRandom(state);
        state.objects.push({
          id: state.seed,
          kind: "hazard",
          x: RUNNER_WIDTH + 40,
          y: RUNNER_GROUND - 28,
          variant: random < 0.34 ? "box" : random < 0.67 ? "cone" : "stone",
        });
        state.nextHazard += hazardGap;
      }

      while (state.distance >= state.nextStar && state.nextStar <= rules.goalDistance) {
        const random = nextRunnerRandom(state);
        state.objects.push({
          id: state.seed,
          kind: "star",
          x: RUNNER_WIDTH + 30,
          y: 220 + random * 70,
          variant: "stone",
        });
        state.nextStar += starGap;
      }

      for (const item of state.objects) item.x -= rules.speed * dt;

      if (performance.now() >= state.invulnerableUntil) {
        const hit = state.objects.find(
          item =>
            item.kind === "hazard" &&
            rectOverlap(
              RUNNER_PLAYER_X,
              state.playerY,
              RUNNER_PLAYER_SIZE - 12,
              RUNNER_PLAYER_SIZE - 8,
              item.x,
              item.y,
              48,
              56
            )
        );

        if (hit) {
          state.lives -= 1;
          state.combo = 0;
          state.score = Math.max(0, state.score - rules.obstaclePenalty);
          state.invulnerableUntil = performance.now() + 1200;
          state.playerY = RUNNER_GROUND - RUNNER_PLAYER_SIZE / 2;
          state.velocityY = 0;
          onSound("miss");
          setFeedback(
            state.lives > 0
              ? "عائق! خذ نفسًا وحاول القفزة التالية بهدوء."
              : "انتهت المحاولات. جرّب الجولة مرة أخرى."
          );
          if (state.lives <= 0) {
            state.gameOver = true;
            const finalHud = runnerHud(state, levels.length);
            setModel({ ...state });
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
        if (
          item.kind === "star" &&
          rectOverlap(
            RUNNER_PLAYER_X,
            state.playerY,
            RUNNER_PLAYER_SIZE,
            RUNNER_PLAYER_SIZE,
            item.x,
            item.y,
            34,
            34
          )
        ) {
          collected.add(item.id);
          state.collectibles += 1;
          state.combo += 1;
          state.score += rules.starReward + Math.min(90, state.combo * 10);
          onSound("collect");
          setFeedback("نجمة! السلسلة مستمرة.");
        }
      }

      state.objects = state.objects.filter(item => !collected.has(item.id) && item.x > -100);

      const checkpointDistance = rules.checkpointDistances[state.checkpointIndex];
      if (
        checkpointDistance !== undefined &&
        state.distance >= checkpointDistance &&
        questions.length > state.checkpointIndex
      ) {
        state.questionOpen = true;
        setQuestion(questions[state.checkpointIndex]);
        setSelectedAnswer(null);
        setFeedback("محطة معرفة: أجب عن السؤال ثم واصل الرحلة.");
      }

      if (state.distance >= rules.goalDistance) {
        state.completed = true;
        state.levelIndex = levels.length - 1;
        state.score += rules.completionBonus;
        const finalHud = runnerHud(state, levels.length);
        setModel({ ...state });
        onHud(finalHud);
        if (!completionRef.current) {
          completionRef.current = true;
          onSound("success");
          setFeedback("أكملت رحلة ذِكر رانر. أحسنت!");
          onResult(finalHud);
        }
        return;
      }

      if (timestamp - renderClockRef.current >= 50) {
        renderClockRef.current = timestamp;
        const snapshot = { ...state, objects: [...state.objects] };
        setModel(snapshot);
        onHud(runnerHud(state, levels.length));
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [levels, onHud, onResult, onSound, paused, questions, rules]);

  const answerQuestion = (answer: number) => {
    if (selectedAnswer !== null || !question) return;
    const state = modelRef.current;
    const correct = answer === question.correctAnswer;
    setSelectedAnswer(answer);
    if (correct) {
      state.score += 180;
      state.combo += 1;
      onSound("success");
      setFeedback("إجابة صحيحة. افتح الطريق!");
    } else {
      state.score = Math.max(0, state.score - rules.obstaclePenalty);
      state.combo = 0;
      onSound("miss");
      setFeedback("الإجابة غير صحيحة، راجع المعلومة ثم تابع.");
    }

    window.setTimeout(() => {
      state.questionOpen = false;
      state.checkpointIndex += 1;
      setQuestion(null);
      setSelectedAnswer(null);
      setModel({ ...state });
      onHud(runnerHud(state, levels.length));
    }, 650);
  };

  const theme = levels[model.levelIndex]?.theme ?? "garden";
  const progress = (model.distance / rules.goalDistance) * 100;
  const characterState =
    model.gameOver ? "hit" : model.completed ? "celebrate" : model.playerY < RUNNER_GROUND - 15 ? "jump" : "run";

  return (
    <KidsGameStage
      theme={theme === "market" ? "oasis" : theme === "mosque" ? "mosque" : theme === "stars" || theme === "dawn" || theme === "gold" ? "night" : "garden"}
      ariaLabel="ZIKR Runner"
    ><KidsGameWorld gameId="zikr-runner" />
      <KidsGameHeader
        eyebrow="ZIKR RUNNER • المرجع البصري"
        title="ذِكر رانر"
        description={levels[model.levelIndex]?.subtitleAr ?? ""}
        right={<div className="hidden w-52 sm:block"><KidsProgress value={progress} label="رحلة اللعبة" /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: model.score, tone: "text-brand-gold" },
            { label: "النجوم", value: model.collectibles, tone: "text-brand-emerald" },
            { label: "السلسلة", value: model.combo, tone: "text-violet-200" },
            { label: "المحاولات", value: model.lives, tone: "text-sky-200" },
            { label: "المستوى", value: (model.levelIndex + 1) + "/" + levels.length, tone: "text-amber-200" },
          ]}
        />
      </div>

      <div
        className="relative mx-4 mt-4 h-[430px] touch-none overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b2430]/80 sm:mx-6"
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => setSwipeStart({ x: event.clientX, y: event.clientY })}
        onPointerUp={(event: PointerEvent<HTMLDivElement>) => {
          if (!swipeStart) return;
          const dy = event.clientY - swipeStart.y;
          setSwipeStart(null);
          if (dy < -18) requestJump();
        }}
        onPointerCancel={() => setSwipeStart(null)}
        onPointerLeave={() => setSwipeStart(null)}
      >
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#07131b] to-transparent" />
        <GardenBackdrop />
        {theme === "mosque" && <MosqueBackdrop compact />}

        <div className="absolute left-7 top-6 rounded-full border border-brand-gold/15 bg-black/20 px-4 py-2 text-xs text-brand-cream/60">
          {Math.min(100, Math.round(progress))}% — ارفع تركيزك
        </div>

        {model.objects.map(item =>
          item.kind === "star" ? (
            <div
              key={item.id}
              className="absolute z-10"
              style={{ left: (item.x / RUNNER_WIDTH) * 100 + "%", top: item.y }}
            >
              <StarToken pulse size={38} />
            </div>
          ) : (
            <div
              key={item.id}
              className="absolute z-10"
              style={{
                left: (item.x / RUNNER_WIDTH) * 100 + "%",
                top: item.y,
                transform: "translate(-50%,-50%)",
              }}
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl border-2 border-rose-200/40 bg-rose-200/10 text-xl text-rose-100 shadow-lg">
                {item.variant === "box" ? "▣" : item.variant === "cone" ? "▲" : "●"}
              </div>
            </div>
          )
        )}

        <div
          className="absolute z-20 transition-[top] duration-75"
          style={{
            left: (RUNNER_PLAYER_X / RUNNER_WIDTH) * 100 + "%",
            top: model.playerY,
            transform: "translate(-50%,-50%)",
          }}
        >
          <KidCharacter state={characterState} size={72} />
        </div>

        <div className="absolute bottom-0 inset-x-0 z-30 border-t border-white/10 bg-black/25 px-4 py-4 backdrop-blur-md">
          <TouchArrows
            onLeft={() => undefined}
            onRight={() => undefined}
            onAction={requestJump}
            actionLabel="اقفز"
          />
        </div>

        {model.questionOpen && question && (
          <div className="absolute inset-0 z-40 grid place-items-center bg-[#041018]/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl rounded-[2rem] border border-brand-gold/25 bg-[#091b27] p-5 shadow-2xl sm:p-7">
              <p className="text-xs font-black tracking-[0.18em] text-brand-emerald">محطة معرفة</p>
              <h4 className="mt-3 text-2xl font-black text-brand-cream">{question.text}</h4>
              <div className="mt-5 grid gap-3">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => answerQuestion(index)}
                    disabled={selectedAnswer !== null}
                    className={[
                      "rounded-2xl border p-4 text-right transition",
                      selectedAnswer === index
                        ? index === question.correctAnswer
                          ? "border-brand-emerald bg-brand-emerald/15 text-brand-emerald"
                          : "border-rose-300/30 bg-rose-300/10 text-rose-100"
                        : selectedAnswer !== null && index === question.correctAnswer
                          ? "border-brand-emerald/60 bg-brand-emerald/10 text-brand-emerald"
                          : "border-white/10 bg-white/[0.03] text-brand-cream hover:border-brand-gold/40",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {(model.gameOver || model.completed) && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-[#030b10]/82 p-4 backdrop-blur-md">
            <div className="w-full max-w-xl rounded-[2rem] border border-brand-gold/20 bg-[#091722]/95 p-6 text-center">
              <KidCharacter state={model.completed ? "celebrate" : "hit"} size={82} />
              <h4 className="mt-2 text-3xl font-black text-brand-cream">
                {model.completed ? "أتممت الرحلة!" : "جولة جديدة؟"}
              </h4>
              <p className="mt-2 text-sm leading-7 text-brand-cream/60">
                {model.completed ? "وصلت للبوابة الذهبية وجمعت نجومًا في الطريق." : "ارجع من البداية وحاول توقيت القفزات بهدوء."}
              </p>
            </div>
          </div>
        )}
      </div>
      <GameToast tone={model.gameOver ? "rose" : model.completed ? "emerald" : "gold"}>{feedback}</GameToast>
      <div className="p-4 pt-2 sm:p-6 sm:pt-3">
        <div className="h-2 overflow-hidden rounded-full bg-white/8 sm:hidden">
          <div className="h-full rounded-full bg-brand-gold" style={{ width: progress + "%" }} />
        </div>
      </div>
    </KidsGameStage>
  );
}

type RoadObject = {
  id: number;
  lane: number;
  kind: "hazard" | "star";
  position: number;
  variant: "cone" | "stone" | "lantern";
};

type RoadModel = {
  lane: number;
  distance: number;
  score: number;
  collectibles: number;
  combo: number;
  mistakes: number;
  checkpointIndex: number;
  questionOpen: boolean;
  completed: boolean;
  objects: RoadObject[];
  seed: number;
  levelIndex: number;
};

const ROAD_LANES = 3;
const ROAD_PLAYER_POSITION = 82;

export function ZikrRoadGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: ActionGameProps) {
  const rules = useMemo(() => getZikrRoadRules(difficulty), [difficulty]);
  const questions = useMemo(() => getApprovedRoadQuestions(), []);
  const createRoadState = (): RoadModel => ({
    lane: 1,
    distance: 0,
    score: 0,
    collectibles: 0,
    combo: 0,
    mistakes: 0,
    checkpointIndex: 0,
    questionOpen: false,
    completed: false,
    objects: [],
    seed: difficulty.length * 71 + 4,
    levelIndex: 0,
  });
  const stateRef = useRef<RoadModel>(createRoadState());
  const [state, setState] = useState<RoadModel>(createRoadState);
  const [question, setQuestion] = useState<VerifiedQuizQuestion | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("غيّر المسار واجمع النجوم وتوقف عند محطات التعلم.");
  const completionRef = useRef(false);

  const reset = () => {
    const next: RoadModel = {
      lane: 1,
      distance: 0,
      score: 0,
      collectibles: 0,
      combo: 0,
      mistakes: 0,
      checkpointIndex: 0,
      questionOpen: false,
      completed: false,
      objects: [],
      seed: difficulty.length * 71 + 4,
      levelIndex: 0,
    };
    stateRef.current = next;
    setState({ ...next });
    setQuestion(null);
    setAnswer(null);
    setFeedback("غيّر المسار واجمع النجوم وتوقف عند محطات التعلم.");
    completionRef.current = false;
    onHud({
      score: 0,
      collectibles: 0,
      distance: 0,
      combo: 0,
      level: 1,
      completed: false,
    });
  };

  useEffect(() => {
    reset();
    // Reset is intentionally controlled by difficulty/restartToken.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, restartToken, rules]);

  const move = (delta: number) => {
    const current = stateRef.current;
    if (paused || current.questionOpen || current.completed) return;
    const nextLane = Math.max(0, Math.min(ROAD_LANES - 1, current.lane + delta));
    if (nextLane === current.lane) return;
    current.lane = nextLane;
    setState({ ...current, objects: [...current.objects] });
    onSound("move");
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const action = gameKeyAction(event);
      if (action === "left") {
        event.preventDefault();
        move(-1);
      }
      if (action === "right") {
        event.preventDefault();
        move(1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // move reads refs/props intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = stateRef.current;
      if (paused || current.questionOpen || current.completed) return;

      const dt = 0.05;
      const levelSize = rules.goalDistance / rules.levelCount;
      const nextLevelIndex = Math.min(rules.levelCount - 1, Math.floor(current.distance / Math.max(1, levelSize)));
      const levelMeta = getKidsLevelMeta("zikr-road", difficulty, nextLevelIndex);
      const stageSpeed = rules.speed * levelMeta.pace;
      current.distance = Math.min(rules.goalDistance, current.distance + stageSpeed * dt);
      current.score += stageSpeed * dt;

      if (nextLevelIndex !== current.levelIndex) {
        current.levelIndex = nextLevelIndex;
        current.objects = [];
        current.combo = 0;
        setFeedback("دخلت " + levelMeta.titleAr + ".");
        onSound("success");
      }

      current.seed = (current.seed * 1664525 + 1013904223 + levelMeta.seed) >>> 0;

      const stageHazardInterval = Math.max(280, rules.hazardInterval / (0.9 + (levelMeta.pattern % 5) * 0.08));
      const stageStarInterval = Math.max(170, rules.starInterval / (0.95 + (levelMeta.pattern % 4) * 0.07));

      const nextObjects = current.objects.map(object => ({
        ...object,
        position: object.position + Math.max(0.85, stageSpeed * dt / 8),
      }));

      if (Math.floor(current.distance / stageHazardInterval) > Math.floor((current.distance - stageSpeed * dt) / stageHazardInterval)) {
        const lane = current.seed % ROAD_LANES;
        nextObjects.push({
          id: current.seed,
          lane,
          kind: "hazard",
          position: -8,
          variant: current.seed % 3 === 0 ? "lantern" : current.seed % 2 === 0 ? "stone" : "cone",
        });
      }

      if (Math.floor(current.distance / stageStarInterval) > Math.floor((current.distance - stageSpeed * dt) / stageStarInterval)) {
        const lane = (current.seed >>> 5) % ROAD_LANES;
        nextObjects.push({
          id: current.seed + 1,
          lane,
          kind: "star",
          position: -5,
          variant: "cone",
        });
      }

      const hits = nextObjects.filter(
        item =>
          item.lane === current.lane &&
          item.position < ROAD_PLAYER_POSITION &&
          item.position + Math.max(0.75, stageSpeed * dt / 8) >= ROAD_PLAYER_POSITION
      );

      for (const hit of hits) {
        if (hit.kind === "star") {
          current.collectibles += 1;
          current.combo += 1;
          current.score += 100 + Math.min(100, current.combo * 10);
          onSound("collect");
          setFeedback("نجمة! استمر في المسار.");
        } else {
          current.mistakes += 1;
          current.combo = 0;
          current.score = Math.max(0, current.score - rules.mistakePenalty);
          onSound("miss");
          setFeedback("عائق! غيّر المسار قبل الإشارة التالية.");
        }
      }

      const hitIds = new Set(hits.map(hit => hit.id));
      current.objects = nextObjects.filter(item => !hitIds.has(item.id) && item.position < 110);

      const checkpoint = rules.checkpointDistances[current.checkpointIndex];
      if (checkpoint !== undefined && current.distance >= checkpoint && questions.length > current.checkpointIndex) {
        current.questionOpen = true;
        setQuestion(questions[current.checkpointIndex]);
        setAnswer(null);
        setFeedback("محطة تعلم: اختر إجابة ثم أكمل القيادة.");
      }

      if (current.distance >= rules.goalDistance) {
        current.completed = true;
        const finalHud: WorldHud = {
          score: Math.max(0, Math.floor(current.score) + 500),
          collectibles: current.collectibles,
          distance: Math.floor(current.distance),
          combo: current.combo,
          level: rules.levelCount,
          completed: true,
        };
        setState({ ...current, objects: [...current.objects] });
        onHud(finalHud);
        if (!completionRef.current) {
          completionRef.current = true;
          onSound("success");
          onResult(finalHud);
        }
        return;
      }

      const hud: WorldHud = {
        score: Math.max(0, Math.floor(current.score)),
        collectibles: current.collectibles,
        distance: Math.floor(current.distance),
        combo: current.combo,
        level: current.levelIndex + 1,
        completed: false,
      };
      setState({ ...current, objects: [...current.objects] });
      onHud(hud);
    }, 50);

    return () => window.clearInterval(interval);
  }, [difficulty, onHud, onResult, onSound, paused, questions, rules]);

  const answerCheckpoint = (index: number) => {
    if (!question || answer !== null) return;
    const current = stateRef.current;
    setAnswer(index);
    if (index === question.correctAnswer) {
      current.combo += 1;
      current.score += 160;
      onSound("success");
      setFeedback("إجابة صحيحة! افتح الطريق.");
    } else {
      current.combo = 0;
      current.score = Math.max(0, current.score - rules.mistakePenalty);
      onSound("miss");
      setFeedback("راجع السؤال ثم أكمل الرحلة.");
    }
    window.setTimeout(() => {
      current.questionOpen = false;
      current.checkpointIndex += 1;
      setQuestion(null);
      setAnswer(null);
      setState({ ...current, objects: [...current.objects] });
    }, 650);
  };

  return (
    <KidsGameStage theme="oasis" ariaLabel="طريق ذِكر"><KidsGameWorld gameId="zikr-road" />
      <KidsGameHeader
        eyebrow="ZIKR ROAD"
        title="طريق ذِكر"
        description="قيادة خيالية بثلاثة مسارات. القرار في اللحظة المناسبة يغير النتيجة."
        right={<div className="hidden w-52 sm:block"><KidsProgress value={(state.distance / rules.goalDistance) * 100} /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: state.score, tone: "text-brand-gold" },
            { label: "النجوم", value: state.collectibles, tone: "text-brand-emerald" },
            { label: "الأخطاء", value: state.mistakes, tone: "text-rose-100" },
            { label: "المسافة", value: state.distance, tone: "text-sky-200" },
            { label: "المستوى", value: state.levelIndex + 1 + "/" + rules.levelCount, tone: "text-violet-200" },
          ]}
        />
      </div>

      <div className="relative mx-4 mt-4 h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b2a34] sm:mx-6">
        <MosqueBackdrop compact />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,#5fd1a622,transparent_32%),linear-gradient(180deg,#17454a,#0a2730_68%,#07151d)]" />
        <div className="absolute inset-x-[20%] bottom-0 top-0 rounded-t-[44%] border-x border-white/5 bg-[#0c222a]/90" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-brand-gold/10" />
        <div className="absolute inset-y-0 left-[33.333%] w-px bg-white/5" />
        <div className="absolute inset-y-0 left-[66.666%] w-px bg-white/5" />

        <div className="absolute left-5 top-5 rounded-full border border-brand-emerald/20 bg-brand-emerald/10 px-4 py-2 text-xs text-brand-emerald">
          المسار {state.lane + 1} / 3
        </div>

        {state.objects.map(item => (
          <div
            key={item.id}
            className="absolute z-20 -translate-x-1/2"
            style={{
              left: (16.5 + item.lane * 33.5) + "%",
              top: item.position + "%",
            }}
          >
            {item.kind === "star" ? (
              <StarToken size={40} pulse />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-[1rem] border-2 border-brand-gold/25 bg-[#4a2b27] text-lg text-brand-gold shadow-lg">
                {item.variant === "lantern" ? "✧" : item.variant === "stone" ? "◆" : "▲"}
              </div>
            )}
          </div>
        ))}

        <div
          className="absolute z-30"
          style={{
            left: (16.5 + state.lane * 33.5) + "%",
            top: ROAD_PLAYER_POSITION + "%",
            transform: "translate(-50%,-50%)",
          }}
        >
          <div className="relative">
            <KidCharacter variant="explorer" state={paused ? "idle" : "run"} size={66} />
            <div className="absolute -bottom-1 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full border border-brand-gold/20 bg-brand-gold/10" />
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/30 px-4 py-4 backdrop-blur-md">
          <TouchArrows onLeft={() => move(-1)} onRight={() => move(1)} onAction={() => undefined} actionLabel="استمر" />
        </div>

        {state.questionOpen && question && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-[#041017]/85 p-4 backdrop-blur-md">
            <div className="w-full max-w-2xl rounded-[2rem] border border-brand-gold/25 bg-[#0a1b26] p-5 sm:p-7">
              <p className="text-xs font-black tracking-[0.18em] text-brand-emerald">محطة الطريق</p>
              <h4 className="mt-3 text-2xl font-black text-brand-cream">{question.text}</h4>
              <div className="mt-5 grid gap-3">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => answerCheckpoint(index)}
                    disabled={answer !== null}
                    className={[
                      "rounded-2xl border p-4 text-right transition",
                      answer === index
                        ? index === question.correctAnswer
                          ? "border-brand-emerald bg-brand-emerald/15 text-brand-emerald"
                          : "border-rose-300/30 bg-rose-300/10 text-rose-100"
                        : answer !== null && index === question.correctAnswer
                          ? "border-brand-emerald/60 bg-brand-emerald/10 text-brand-emerald"
                          : "border-white/10 bg-white/[0.03] text-brand-cream hover:border-brand-gold/40",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <GameToast>{feedback}</GameToast>
    </KidsGameStage>
  );
}

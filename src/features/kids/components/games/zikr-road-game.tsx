"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import { getZikrRoadLevel, getZikrRoadRules } from "@/lib/games/zikr-road";
import {
  getApprovedScenarioQuestions,
  type VerifiedQuizQuestion,
} from "@/lib/games/verified-content";
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

type RoadObject = {
  id: number;
  lane: number;
  kind: "hazard" | "star";
  position: number;
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
  nextHazardDistance: number;
  nextStarDistance: number;
  objects: RoadObject[];
};

const LANE_COUNT = 3;
const PLAYER_POSITION = 84;
const TICK_MS = 50;

function createModel(rules: ReturnType<typeof getZikrRoadRules>): RoadModel {
  return {
    lane: 1,
    distance: 0,
    score: 0,
    collectibles: 0,
    combo: 0,
    mistakes: 0,
    checkpointIndex: 0,
    questionOpen: false,
    completed: false,
    nextHazardDistance: rules.hazardInterval,
    nextStarDistance: rules.starInterval,
    objects: [],
  };
}

function hudFromModel(
  model: RoadModel,
  difficulty: GameDifficulty,
  goalDistance: number
): WorldHud {
  const level = getZikrRoadLevel(model.distance, goalDistance);
  const completionBonus = model.completed ? 500 : 0;
  const score = Math.max(0, Math.floor(model.score) + completionBonus);

  return {
    score,
    collectibles: model.collectibles,
    distance: Math.floor(model.distance),
    combo: model.combo,
    level: difficulty === "easy" ? Math.min(level, 3) : Math.min(level + (difficulty === "hard" ? 0 : 0), 3),
    completed: model.completed,
  };
}

export function ZikrRoadGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const rules = getZikrRoadRules(difficulty);
  const questions = useMemo(
    () => getApprovedScenarioQuestions().slice(0, rules.checkpointDistances.length),
    [rules.checkpointDistances.length]
  );

  const modelRef = useRef<RoadModel>(createModel(rules));
  const objectIdRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const completionReportedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  const [objects, setObjects] = useState<RoadObject[]>([]);
  const [lane, setLane] = useState(1);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(
    "تحرك بين المسارات، اجمع النجوم، وتوقف عند محطات التعلم."
  );
  const [hud, setHud] = useState<WorldHud>(() =>
    hudFromModel(modelRef.current, difficulty, rules.goalDistance)
  );

  const syncHud = () => {
    const nextHud = hudFromModel(
      modelRef.current,
      difficulty,
      rules.goalDistance
    );
    setHud(nextHud);
    onHud(nextHud);
  };

  const moveLane = (delta: number) => {
    const model = modelRef.current;
    if (paused || model.questionOpen || model.completed) return;

    const nextLane = Math.max(0, Math.min(LANE_COUNT - 1, model.lane + delta));
    if (nextLane === model.lane) return;

    model.lane = nextLane;
    setLane(nextLane);
    onSound("move");
  };

  const restart = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    modelRef.current = createModel(rules);
    objectIdRef.current = 0;
    completionReportedRef.current = false;
    setObjects([]);
    setLane(1);
    setQuestionIndex(null);
    setSelectedAnswer(null);
    setFeedback(
      "تحرك بين المسارات، اجمع النجوم، وتوقف عند محطات التعلم."
    );
    syncHud();
  };

  useEffect(() => {
    restart();
    // restart intentionally depends on the selected difficulty/restart token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, restartToken, rules.goalDistance, rules.hazardInterval, rules.starInterval]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        moveLane(-1);
      } else if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        moveLane(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // Keyboard navigation intentionally reads the latest refs/props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const model = modelRef.current;

      if (paused || model.questionOpen || model.completed) {
        syncHud();
        return;
      }

      const dt = TICK_MS / 1000;
      const distanceStep = Math.min(
        rules.goalDistance - model.distance,
        rules.speed * dt
      );
      model.distance += Math.max(0, distanceStep);
      model.score += Math.max(0, distanceStep);

      const movement = Math.max(0.75, (rules.speed / 8) * dt);
      let nextObjects = model.objects.map((object) => ({
        ...object,
        position: object.position + movement,
      }));

      while (model.distance >= model.nextHazardDistance) {
        nextObjects.push({
          id: ++objectIdRef.current,
          lane: Math.floor(Math.random() * LANE_COUNT),
          kind: "hazard",
          position: -8,
        });
        model.nextHazardDistance += rules.hazardInterval;
      }

      while (model.distance >= model.nextStarDistance) {
        const preferredLane = Math.floor(Math.random() * LANE_COUNT);
        nextObjects.push({
          id: ++objectIdRef.current,
          lane: preferredLane,
          kind: "star",
          position: -6,
        });
        model.nextStarDistance += rules.starInterval;
      }

      const hitObjects = nextObjects.filter(
        (object) =>
          object.lane === model.lane &&
          object.position < PLAYER_POSITION &&
          object.position + movement >= PLAYER_POSITION
      );

      for (const object of hitObjects) {
        if (object.kind === "star") {
          model.collectibles += 1;
          model.combo += 1;
          onSound("collect");
          setFeedback("نجمة! حافظ على التركيز واستمر في الطريق.");
        } else {
          model.mistakes += 1;
          model.combo = 0;
          model.score = Math.max(0, model.score - rules.mistakePenalty);
          onSound("miss");
          setFeedback(
            rules.mistakePenalty > 0
              ? "اصطدمت بعائق. عد للمسار وحاول بهدوء."
              : "اصطدمت بعائق، لكن طريق ذِكر الآمن لا يفرض خصمًا في هذا المستوى."
          );
        }
      }

      const hitIds = new Set(hitObjects.map((object) => object.id));
      nextObjects = nextObjects
        .filter((object) => !hitIds.has(object.id))
        .filter((object) => object.position < 108);

      model.objects = nextObjects;
      setObjects(nextObjects);

      const reachedCheckpoint =
        questions.length > 0 &&
        model.checkpointIndex < rules.checkpointDistances.length &&
        model.distance >=
          rules.checkpointDistances[model.checkpointIndex];

      if (reachedCheckpoint) {
        model.questionOpen = true;
        setQuestionIndex(model.checkpointIndex);
        setSelectedAnswer(null);
        setFeedback("محطة تعلم جديدة. اقرأ السؤال ثم اختر إجابة.");
        onSound("move");
      }

      if (model.distance >= rules.goalDistance && !model.completed) {
        model.completed = true;
        const finalHud = hudFromModel(
          model,
          difficulty,
          rules.goalDistance
        );
        setHud(finalHud);
        onHud(finalHud);

        if (!completionReportedRef.current) {
          completionReportedRef.current = true;
          onSound("success");
          setFeedback("أتممت طريق ذِكر. أحسنت في التركيز والاستمرار.");
          onResult(finalHud);
        }
      } else {
        syncHud();
      }
    }, TICK_MS);

    return () => window.clearInterval(interval);
    // The model is intentionally mutable through refs so the loop never captures stale gameplay state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, onHud, onResult, onSound, paused, questions.length, rules]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const chooseAnswer = (answerIndex: number) => {
    const model = modelRef.current;
    if (paused || !model.questionOpen || selectedAnswer !== null) return;

    const index = questionIndex ?? model.checkpointIndex;
    const question: VerifiedQuizQuestion | undefined = questions[index];
    if (!question) return;

    const correct = answerIndex === question.correctAnswer;
    setSelectedAnswer(answerIndex);

    if (correct) {
      model.combo += 1;
      model.score += 150;
      onSound("success");
      setFeedback("إجابة صحيحة! افتح الطريق واستمر.");
    } else {
      model.mistakes += 1;
      model.combo = 0;
      model.score = Math.max(0, model.score - rules.mistakePenalty);
      onSound("miss");
      setFeedback(
        rules.mistakePenalty > 0
          ? "إجابة غير صحيحة. راجع الموقف ثم واصل الرحلة."
          : "إجابة غير صحيحة. في المستوى السهل لا يوجد خصم."
      );
    }

    timeoutRef.current = window.setTimeout(() => {
      model.questionOpen = false;
      model.checkpointIndex += 1;
      setQuestionIndex(null);
      setSelectedAnswer(null);
      syncHud();
      setFeedback(
        correct
          ? "ممتاز. المحطة التالية ستظهر أثناء الطريق."
          : "واصل الطريق. محطة التعلم التالية في الأمام."
      );
      timeoutRef.current = null;
    }, 650);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    touchStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || paused || modelRef.current.questionOpen) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      moveLane(dx > 0 ? 1 : -1);
    }
  };

  const progress =
    rules.goalDistance > 0
      ? Math.min(100, Math.round((hud.distance / rules.goalDistance) * 100))
      : 0;

  const activeQuestion =
    questionIndex === null ? null : questions[questionIndex] ?? null;

  return (
    <section
      dir="rtl"
      aria-label="طريق ذِكر"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[radial-gradient(circle_at_top,#24584f55,transparent_38%),linear-gradient(145deg,#061a23,#101a29)] p-4 shadow-2xl shadow-black/20 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-emerald/80">
            ZIKR ROAD
          </p>
          <h3 className="mt-1 text-2xl font-black text-brand-cream">
            طريق ذِكر
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/65">
            طريق تفاعلي قصير: تحرك بين المسارات، اجمع النجوم، وتوقف عند محطات
            تعليمية مأخوذة من المحتوى المعتمد.
          </p>
        </div>

        <div className="min-w-52 rounded-2xl border border-brand-cream/10 bg-black/20 p-4">
          <div className="flex items-center justify-between text-xs text-brand-cream/55">
            <span>تقدم الرحلة</span>
            <strong className="text-brand-gold">{progress}%</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-brand-emerald transition-[width] duration-150"
              style={{ width: progress + "%" }}
            />
          </div>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["النقاط", hud.score, "text-brand-gold"],
          ["النجوم", hud.collectibles, "text-brand-emerald"],
          ["الأخطاء", modelRef.current.mistakes, "text-brand-cream"],
          ["المسافة", hud.distance, "text-sky-200"],
          ["المستوى", hud.level, "text-violet-200"],
        ].map(([label, value, className]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
          >
            <span className="block text-xs text-brand-cream/45">
              {label}
            </span>
            <strong className={"mt-1 block text-lg " + String(className)}>
              {value}
            </strong>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-emerald/15 bg-brand-emerald/[0.04] px-4 py-3 text-sm text-brand-cream/70">
        <span>
          المسار الحالي: {lane + 1} / {LANE_COUNT}
        </span>
        <span>
          المحطات التعليمية: {Math.min(hud.completed ? rules.checkpointDistances.length : modelRef.current.checkpointIndex, rules.checkpointDistances.length)} / {rules.checkpointDistances.length}
        </span>
      </div>

      <div
        className="relative mx-auto h-[520px] max-w-2xl touch-none overflow-hidden rounded-3xl border border-brand-gold/15 bg-[#0a202a]"
        role="application"
        aria-label="طريق تفاعلي"
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#123b46,#0c2730)]" />
        <div className="absolute inset-x-0 bottom-0 h-[78%] bg-[linear-gradient(90deg,#0c2530,#102f3a_10%,#102f3a_90%,#0c2530)]" />
        <div className="absolute inset-y-0 left-1/3 w-px bg-brand-gold/15" />
        <div className="absolute inset-y-0 left-2/3 w-px bg-brand-gold/15" />
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_15%_35%,#5fd1a622,transparent_20%),radial-gradient(circle_at_80%_20%,#f3c96922,transparent_18%)]" />

        <div className="absolute inset-x-0 top-5 flex items-start justify-between px-5 text-xs font-semibold text-brand-cream/45">
          <span>ابدأ</span>
          <span>انتبه للعوائق</span>
          <span>محطة تعلم</span>
        </div>

        {objects.map((object) => (
          <div
            key={object.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 select-none"
            style={{
              left: String(16.67 + object.lane * 33.33) + "%",
              top: object.position + "%",
            }}
            aria-hidden="true"
          >
            {object.kind === "star" ? (
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-brand-cream/80 bg-brand-gold text-2xl text-[#513f08] shadow-lg shadow-brand-gold/20">
                ★
              </div>
            ) : (
              <div className="grid h-14 w-12 place-items-center rounded-xl border-2 border-[#ffd9a8] bg-[#a34f27] text-xl text-[#fff7dc] shadow-lg shadow-black/30">
                !
              </div>
            )}
          </div>
        ))}

        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-150 ease-out"
          style={{
            left: String(16.67 + lane * 33.33) + "%",
            top: PLAYER_POSITION + "%",
          }}
          aria-label={"المسار " + String(lane + 1)}
        >
          <div className="grid h-20 w-14 place-items-center rounded-2xl border-4 border-brand-gold bg-brand-emerald text-3xl text-[#063127] shadow-xl shadow-brand-emerald/20">
            ✦
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-black/25 px-5 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => moveLane(-1)}
            disabled={paused || modelRef.current.questionOpen || modelRef.current.completed}
            className="min-h-14 min-w-20 rounded-2xl border border-brand-cream/15 bg-black/25 px-5 text-2xl text-brand-cream transition hover:border-brand-gold disabled:opacity-40"
            aria-label="الانتقال إلى اليسار"
          >
            ←
          </button>

          <div className="text-center text-xs leading-6 text-brand-cream/55">
            <div>اسحب يمينًا أو يسارًا</div>
            <div>أو استخدم الأسهم</div>
          </div>

          <button
            type="button"
            onClick={() => moveLane(1)}
            disabled={paused || modelRef.current.questionOpen || modelRef.current.completed}
            className="min-h-14 min-w-20 rounded-2xl border border-brand-cream/15 bg-black/25 px-5 text-2xl text-brand-cream transition hover:border-brand-gold disabled:opacity-40"
            aria-label="الانتقال إلى اليمين"
          >
            →
          </button>
        </div>

        {activeQuestion && (
          <div className="absolute inset-0 z-40 grid place-items-center bg-[#041118]/90 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-violet-300/20 bg-[#091a28] p-5 shadow-2xl sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold tracking-[0.16em] text-violet-200/75">
                    محطة التعلم {String((questionIndex ?? 0) + 1)}
                  </span>
                  <h4 className="mt-2 text-xl font-black leading-9 text-brand-cream">
                    {activeQuestion.text}
                  </h4>
                </div>
                <span className="rounded-full border border-brand-cream/10 px-3 py-1 text-xs text-brand-cream/45">
                  توقف الطريق
                </span>
              </div>

              <div className="grid gap-3">
                {activeQuestion.options.map((option, optionIndex) => {
                  const selected = selectedAnswer === optionIndex;
                  const correct =
                    optionIndex === activeQuestion.correctAnswer;

                  return (
                    <button
                      key={String(optionIndex) + "-" + option}
                      type="button"
                      onClick={() => chooseAnswer(optionIndex)}
                      disabled={selectedAnswer !== null}
                      className={[
                        "min-h-16 rounded-2xl border p-4 text-right text-sm font-semibold leading-7 transition",
                        selected && correct
                          ? "border-brand-emerald/60 bg-brand-emerald/10 text-brand-cream"
                          : selected
                            ? "border-red-300/50 bg-red-300/[0.05] text-brand-cream"
                            : "border-brand-cream/10 bg-white/[0.03] text-brand-cream hover:border-violet-300/50",
                      ].join(" ")}
                    >
                      <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/20 text-xs opacity-60">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              <div
                className="mt-4 min-h-12 rounded-2xl border border-brand-gold/10 bg-brand-gold/[0.04] px-4 py-3 text-sm leading-7 text-brand-cream/70"
                role="status"
                aria-live="polite"
              >
                {selectedAnswer === null
                  ? "اختَر الإجابة الأقرب للتصرف الصحيح."
                  : feedback}
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
        {hud.completed
          ? "اكتملت الرحلة. أحسنت في التركيز والاستمرار."
          : feedback}
      </div>

      {hud.completed && (
        <div className="mt-4 rounded-3xl border border-brand-emerald/25 bg-brand-emerald/[0.06] p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-emerald/75">
            انتهى الطريق
          </p>
          <p className="mt-2 text-lg font-semibold leading-9 text-brand-cream">
            وصلت إلى نهاية طريق ذِكر وجمعت {hud.collectibles} نجمة.
          </p>
        </div>
      )}
    </section>
  );
}

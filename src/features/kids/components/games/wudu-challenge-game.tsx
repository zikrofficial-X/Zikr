"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getVerifiedWuduContent, type VerifiedWuduStep } from "@/lib/games/verified-content";
import type { GameDifficulty } from "@/lib/games/registry";
import { shuffleWuduSteps } from "@/lib/games/gameplay-helpers";
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

const STEPS_BY_DIFFICULTY: Record<GameDifficulty, number> = {
  easy: 5,
  normal: 7,
  hard: 9,
};

export function WuduChallengeGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const source = useMemo(() => getVerifiedWuduContent(), []);
  const stepCount = STEPS_BY_DIFFICULTY[difficulty];
  const steps = useMemo(
    () => source.steps.slice(0, stepCount),
    [source.steps, stepCount],
  );
  const choices = useMemo(
    () => shuffleWuduSteps(steps, `${difficulty}:${restartToken}`),
    [difficulty, restartToken, steps],
  );

  const [order, setOrder] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const completionReported = useRef(false);

  useEffect(() => {
    setOrder([]);
    setMistakes(0);
    setFeedback("");
    setShowGuide(false);
    completionReported.current = false;
  }, [difficulty, restartToken, stepCount]);

  const completed = steps.length > 0 && order.length === steps.length;
  const nextOrder = order.length + 1;

  const choose = (step: VerifiedWuduStep) => {
    if (paused || completed || order.includes(step.order)) return;

    if (step.order !== nextOrder) {
      onSound("miss");
      setMistakes(value => value + 1);
      setFeedback("مش دي الخطوة التالية. راجع الترتيب بهدوء.");
      return;
    }

    onSound("collect");
    setOrder(value => [...value, step.order]);
    setFeedback(
      nextOrder === steps.length
        ? "ممتاز! أكملت خطوات الجولة."
        : `خطوة صحيحة: ${step.order} من ${steps.length}`,
    );
  };

  const hud = useMemo<WorldHud>(() => {
    const correct = order.length;
    const baseScore = correct * 260;
    const mistakePenalty = mistakes * 35;
    const combo = Math.max(0, correct - mistakes);
    const completionBonus = completed ? 350 : 0;

    return {
      score: Math.max(0, baseScore + completionBonus - mistakePenalty),
      collectibles: correct,
      distance: 0,
      combo,
      level: difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1,
      completed,
    };
  }, [completed, difficulty, mistakes, order.length]);

  useEffect(() => {
    onHud(hud);
    if (!completed || completionReported.current) return;
    completionReported.current = true;
    onSound("success");
    onResult(hud);
  }, [completed, hud, onHud, onResult, onSound]);

  if (steps.length === 0) {
    return (
      <div
        className="grid min-h-[280px] place-items-center rounded-3xl border border-brand-gold/25 bg-[#071b24] p-6 text-center text-brand-cream/70"
        role="status"
      >
        لا تتوفر خطوات الوضوء المعتمدة حاليًا.
      </div>
    );
  }

  const progress = Math.round((order.length / steps.length) * 100);

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[radial-gradient(circle_at_top,#7dd3fc16,transparent_42%),linear-gradient(145deg,#071b24,#0b2832)] p-4 shadow-2xl shadow-black/20 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-sky-300/80">تحدي الوضوء</p>
          <h3 className="mt-1 text-2xl font-black text-brand-cream">رتّب خطوات الوضوء بهدوء</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/65">
            اختر الخطوة التالية الصحيحة. النص التعليمي يُعرض كما هو من المحتوى المعتمد.
          </p>
        </div>
        <div className="min-w-44 rounded-2xl border border-brand-cream/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-brand-cream/55">
            <span>التقدم</span>
            <strong className="text-brand-gold">{order.length}/{steps.length}</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">النقاط</span>
          <strong className="mt-1 block text-lg text-brand-gold">{hud.score}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">الخطوات</span>
          <strong className="mt-1 block text-lg text-sky-300">{order.length}/{steps.length}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">الأخطاء</span>
          <strong className="mt-1 block text-lg text-brand-cream">{mistakes}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <span className="block text-xs text-brand-cream/50">السلسلة</span>
          <strong className="mt-1 block text-lg text-brand-emerald">{hud.combo}</strong>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-sky-200">ترتيبك الحالي</p>
          <span className="text-xs text-brand-cream/45">الخطوة التالية: {completed ? "اكتملت" : nextOrder}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map(step => {
            const done = order.includes(step.order);
            return (
              <div
                key={step.order}
                className={`rounded-xl border px-4 py-3 text-right text-sm transition ${
                  done
                    ? "border-brand-emerald/30 bg-brand-emerald/10 text-brand-cream"
                    : "border-white/10 bg-black/10 text-brand-cream/35"
                }`}
              >
                <span className="mr-2 text-xs text-brand-gold/75">{step.order}</span>
                {done ? step.text : "لم تُختر بعد"}
              </div>
            );
          })}
        </div>
      </div>

      {!completed && (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-brand-cream/80">اختر الخطوة التالية</p>
            <button
              type="button"
              onClick={() => setShowGuide(value => !value)}
              className="rounded-lg border border-brand-cream/15 px-3 py-2 text-xs text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold"
              aria-expanded={showGuide}
            >
              {showGuide ? "إخفاء المساعدة" : "مساعدة"}
            </button>
          </div>

          {showGuide && (
            <div className="mb-4 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.05] p-4 text-sm leading-7 text-brand-cream/65">
              ابحث عن الرقم التالي في تسلسل الوضوء. لا توجد خسارة؛ يمكنك المحاولة مرة أخرى وتعلم الترتيب.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {choices.map(step => {
              const selected = order.includes(step.order);
              return (
                <button
                  key={step.order}
                  type="button"
                  onClick={() => choose(step)}
                  disabled={paused || selected}
                  className={[
                    "rounded-2xl border p-4 text-right transition duration-200",
                    selected
                      ? "border-brand-emerald/30 bg-brand-emerald/10 opacity-55"
                      : "border-brand-cream/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-sky-300/50 hover:bg-sky-300/[0.05]",
                    paused ? "cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <span className="mb-2 flex items-center justify-between gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-300/10 text-sm font-black text-sky-200">
                      {step.order}
                    </span>
                    <span className="text-[11px] font-semibold tracking-[0.14em] text-brand-cream/35">خطوة</span>
                  </span>
                  <strong className="block text-base leading-8 text-brand-cream">{step.text}</strong>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div
        className="mt-5 min-h-12 rounded-2xl border border-brand-emerald/20 bg-brand-emerald/[0.06] px-4 py-3 text-sm leading-7 text-brand-cream/75"
        role="status"
        aria-live="polite"
      >
        {feedback || "اختر أول خطوة لتبدأ الجولة."}
      </div>

      {completed && (
        <div className="mt-5 rounded-2xl border border-brand-gold/25 bg-brand-gold/[0.06] p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-gold/75">بعد الانتهاء</p>
          <p className="mt-2 text-lg font-semibold leading-9 text-brand-cream">{source.afterDhikr}</p>
        </div>
      )}
    </div>
  );
}

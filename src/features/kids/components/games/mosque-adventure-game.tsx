"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import { getMosqueAdventureRules } from "@/lib/games/mosque-adventure";
import { getApprovedScenarioQuestions, type VerifiedQuizQuestion } from "@/lib/games/verified-content";
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

type Station = { id: string; title: string; subtitle: string; icon: string };

const STATIONS: Station[] = [
  { id: "gate", title: "بوابة العالم", subtitle: "ابدأ الرحلة وافتح الطريق", icon: "◈" },
  { id: "courtyard", title: "ساحة الاختيار", subtitle: "موقف قصير يحتاج قرارًا", icon: "✦" },
  { id: "library", title: "ركن المعرفة", subtitle: "اكتشف محطة جديدة", icon: "▣" },
  { id: "kindness", title: "محطة الخُلُق", subtitle: "موقف آخر قبل نهاية الرحلة", icon: "♥" },
  { id: "treasure", title: "حديقة النور", subtitle: "اجمع نجمة الرحلة الأخيرة", icon: "☾" },
];

export function MosqueAdventureGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const rules = getMosqueAdventureRules(difficulty);
  const questions = useMemo(() => getApprovedScenarioQuestions().slice(0, 2), []);
  const stations = useMemo(() => STATIONS.slice(0, rules.nodeCount), [rules.nodeCount]);

  const [current, setCurrent] = useState(0);
  const [visited, setVisited] = useState<number[]>([]);
  const [questionIndex, setQuestionIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const completionReported = useRef(false);

  useEffect(() => {
    setCurrent(0);
    setVisited([]);
    setQuestionIndex(null);
    setSelectedAnswer(null);
    setFeedback("");
    setMistakes(0);
    completionReported.current = false;
  }, [difficulty, restartToken, rules.nodeCount]);

  const questionForStation = (stationIndex: number): VerifiedQuizQuestion | null => {
    const mappedIndex = rules.questionStationIndexes.indexOf(stationIndex);
    return mappedIndex >= 0 ? questions[mappedIndex] ?? null : null;
  };

  const completed = visited.length === stations.length && stations.length > 0;
  const progress = stations.length ? Math.round((visited.length / stations.length) * 100) : 0;
  const currentStation = stations[current];

  const hud = useMemo<WorldHud>(() => {
    const questionRewards = visited.filter(index => rules.questionStationIndexes.includes(index)).length;
    const base = visited.length * 220;
    const bonus = questionRewards * 80;
    const penalty = mistakes * rules.mistakePenalty;
    const completionBonus = completed ? 500 : 0;
    return {
      score: Math.max(0, base + bonus + completionBonus - penalty),
      collectibles: visited.length,
      distance: visited.length * 120,
      combo: Math.max(0, visited.length - mistakes),
      level: rules.level,
      completed,
    };
  }, [completed, mistakes, rules.level, rules.mistakePenalty, rules.questionStationIndexes, visited]);

  useEffect(() => {
    onHud(hud);
    if (!completed || completionReported.current) return;
    completionReported.current = true;
    onSound("success");
    onResult(hud);
  }, [completed, hud, onHud, onResult, onSound]);

  const completeStation = (stationIndex: number) => {
    if (paused || visited.includes(stationIndex) || questionIndex !== null) return;
    const question = questionForStation(stationIndex);

    if (question) {
      setQuestionIndex(rules.questionStationIndexes.indexOf(stationIndex));
      setSelectedAnswer(null);
      setFeedback("");
      onSound("move");
      return;
    }

    onSound("collect");
    setVisited(value => [...value, stationIndex]);
    setFeedback("اكتملت المحطة. افتح المحطة التالية.");
    setCurrent(index => Math.min(index + 1, stations.length - 1));
  };

  const chooseAnswer = (answer: number) => {
    if (paused || questionIndex === null || selectedAnswer !== null) return;
    const question = questions[questionIndex];
    if (!question) return;

    const correct = answer === question.correctAnswer;
    setSelectedAnswer(answer);

    if (!correct) {
      onSound("miss");
      setMistakes(value => value + 1);
      setFeedback("اختيار غير صحيح. راجع الموقف وحاول مرة أخرى.");
      window.setTimeout(() => setSelectedAnswer(null), 650);
      return;
    }

    onSound("success");
    setFeedback("اختيار صحيح. الطريق مفتوح للمحطة التالية.");
    setVisited(value => [...value, current]);
    window.setTimeout(() => {
      setQuestionIndex(null);
      setSelectedAnswer(null);
      setCurrent(index => Math.min(index + 1, stations.length - 1));
    }, 650);
  };

  if (stations.length === 0 || questions.length < 2) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/25 bg-[#071b24] p-6 text-center text-brand-cream/70" role="status">
        لا تتوفر محتويات المغامرة التعليمية المعتمدة حاليًا.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[radial-gradient(circle_at_top,#2b665d30,transparent_42%),linear-gradient(145deg,#061b24,#101c2a)] p-4 shadow-2xl shadow-black/20 sm:p-6" dir="rtl" aria-label="مغامرة المسجد">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-emerald/80">MOSQUE ADVENTURE</p>
          <h3 className="mt-1 text-2xl font-black text-brand-cream">مغامرة تعليمية داخل عالم ذِكر</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/65">
            تحرك بين محطات خيالية، اجمع النجوم، واتخذ قرارات من المحتوى التعليمي المعتمد. اللعبة لا تتطلب تنفيذ أي نشاط في الواقع.
          </p>
        </div>

        <div className="min-w-48 rounded-2xl border border-brand-cream/10 bg-black/20 p-4">
          <div className="flex items-center justify-between text-xs text-brand-cream/55">
            <span>تقدم الرحلة</span>
            <strong className="text-brand-gold">{visited.length}/{stations.length}</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand-emerald transition-all duration-300" style={{ width: progress + "%" }} />
          </div>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">النقاط</span><strong className="mt-1 block text-lg text-brand-gold">{hud.score}</strong></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">النجوم</span><strong className="mt-1 block text-lg text-brand-emerald">{hud.collectibles}</strong></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">الأخطاء</span><strong className="mt-1 block text-lg text-brand-cream">{mistakes}</strong></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">المستوى</span><strong className="mt-1 block text-lg text-violet-300">{rules.level}</strong></div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-brand-emerald/20 bg-[linear-gradient(180deg,#103840,#0b2630)] p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 opacity-50">
          <div className="absolute inset-x-0 top-1/2 h-px bg-brand-gold/10" />
          <div className="absolute inset-y-0 left-1/3 w-px bg-brand-gold/10" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-brand-gold/10" />
        </div>

        <div className="relative grid gap-4 sm:grid-cols-5">
          {stations.map((station, index) => {
            const isVisited = visited.includes(index);
            const isCurrent = current === index && !isVisited;
            const locked = index > current;
            const question = questionForStation(index);

            return (
              <button
                key={station.id}
                type="button"
                onClick={() => completeStation(index)}
                disabled={paused || locked || isVisited || questionIndex !== null}
                aria-current={isCurrent ? "step" : undefined}
                className={[
                  "group relative min-h-36 rounded-2xl border p-4 text-right transition duration-200",
                  isVisited ? "border-brand-emerald/40 bg-brand-emerald/10" : isCurrent ? "border-brand-gold/60 bg-brand-gold/[0.08] shadow-lg shadow-brand-gold/10 hover:-translate-y-1" : "border-white/8 bg-black/10 opacity-55",
                  paused ? "cursor-not-allowed" : "",
                ].join(" ")}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-black/20 text-xl text-brand-gold">{isVisited ? "✓" : station.icon}</span>
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-brand-cream/35">{index + 1}</span>
                </span>
                <strong className="mt-4 block text-base text-brand-cream">{station.title}</strong>
                <span className="mt-1 block text-xs leading-6 text-brand-cream/50">{station.subtitle}</span>
                {question && !isVisited && isCurrent && (
                  <span className="mt-3 inline-flex rounded-full border border-violet-300/20 bg-violet-300/[0.06] px-2 py-1 text-[10px] text-violet-200">محطة سؤال</span>
                )}
              </button>
            );
          })}
        </div>

        {questionIndex !== null && questions[questionIndex] && (
          <div className="relative mt-5 rounded-3xl border border-violet-300/20 bg-[#0a1726]/95 p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold tracking-[0.16em] text-violet-200/75">محطة السؤال {questionIndex + 1}</span>
                <h4 className="mt-2 text-xl font-black leading-9 text-brand-cream">{questions[questionIndex].text}</h4>
              </div>
              <span className="rounded-full border border-brand-cream/10 px-3 py-1 text-xs text-brand-cream/50">اختر قرارك</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {questions[questionIndex].options.map((option, optionIndex) => {
                const selected = selectedAnswer === optionIndex;
                const correct = optionIndex === questions[questionIndex].correctAnswer;

                return (
                  <button
                    key={String(questionIndex) + "-" + String(optionIndex) + "-" + option}
                    type="button"
                    onClick={() => chooseAnswer(optionIndex)}
                    disabled={paused || selectedAnswer !== null}
                    className={[
                      "min-h-16 rounded-2xl border p-4 text-right text-sm font-semibold leading-7 transition",
                      selected && correct ? "border-brand-emerald/60 bg-brand-emerald/10 text-brand-cream" : selected ? "border-red-300/50 bg-red-300/[0.05] text-brand-cream" : "border-brand-cream/10 bg-white/[0.03] text-brand-cream hover:-translate-y-0.5 hover:border-violet-300/50",
                    ].join(" ")}
                  >
                    <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/20 text-xs opacity-60">{String.fromCharCode(65 + optionIndex)}</span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 min-h-14 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.04] px-4 py-3 text-sm leading-7 text-brand-cream/70" role="status" aria-live="polite">
        {feedback || (currentStation ? "المحطة الحالية: " + currentStation.title + ". افتحها لتكمل الرحلة." : "أكملت الرحلة.")}
      </div>

      {completed && (
        <div className="mt-5 rounded-3xl border border-brand-emerald/25 bg-brand-emerald/[0.06] p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-brand-emerald/75">انتهت الرحلة</p>
          <p className="mt-2 text-lg font-semibold leading-9 text-brand-cream">أحسنت. فتحت جميع محطات المغامرة وأكملت الجولة التعليمية.</p>
        </div>
      )}
    </section>
  );
}
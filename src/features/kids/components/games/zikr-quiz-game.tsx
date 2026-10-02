"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import { getVerifiedKidsQuizQuestions } from "@/lib/games/verified-content";
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

const QUESTION_COUNT: Record<GameDifficulty, number> = { easy: 5, normal: 7, hard: 10 };
const LEVEL: Record<GameDifficulty, number> = { easy: 1, normal: 2, hard: 3 };

export function ZikrQuizGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: Props) {
  const questions = useMemo(() => getVerifiedKidsQuizQuestions().slice(0, QUESTION_COUNT[difficulty]), [difficulty]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const completionReported = useRef(false);

  useEffect(() => {
    setIndex(0); setCorrect(0); setStreak(0); setSelected(null); setFeedback(null); setStartedAt(Date.now()); completionReported.current = false;
  }, [restartToken, difficulty, questions.length]);

  const question = questions[index];
  const total = questions.length;
  const answeredCount = index + (selected === null ? 0 : 1);
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const liveScore = correct * 250 + streak * 50;
  const hud = useMemo<WorldHud>(() => ({ score: liveScore, collectibles: correct, distance: 0, combo: streak, level: LEVEL[difficulty], completed: false }), [correct, difficulty, liveScore, streak]);

  useEffect(() => { onHud(hud); }, [hud, onHud]);

  if (!question) return <div className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/25 bg-[#071b24] p-6 text-center text-brand-cream/70">لا تتوفر أسئلة تعليمية موثقة حاليًا.</div>;

  const choose = (answer: number) => {
    if (paused || selected !== null) return;
    const isCorrect = answer === question.correctAnswer;
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    const nextStreak = isCorrect ? streak + 1 : 0;
    const nextScore = nextCorrect * 250 + nextStreak * 50;
    setSelected(answer); setFeedback(isCorrect ? "correct" : "wrong"); setCorrect(nextCorrect); setStreak(nextStreak); onSound(isCorrect ? "success" : "miss");

    window.setTimeout(() => {
      if (index + 1 < total) { setIndex(value => value + 1); setSelected(null); setFeedback(null); return; }
      if (completionReported.current) return;
      completionReported.current = true;
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const finalHud: WorldHud = { score: nextScore + Math.max(0, 300 - elapsedSeconds * 3), collectibles: nextCorrect, distance: elapsedSeconds, combo: nextStreak, level: LEVEL[difficulty], completed: true };
      onHud(finalHud); onSound("success"); onResult(finalHud);
    }, 900);
  };

  const optionClass = (optionIndex: number) => {
    if (selected === null) return "border-brand-cream/10 bg-white/[0.04] text-brand-cream hover:-translate-y-0.5 hover:border-brand-gold/60 hover:bg-brand-gold/[0.06]";
    if (optionIndex === question.correctAnswer) return "border-brand-emerald/70 bg-brand-emerald/15 text-brand-cream";
    if (optionIndex === selected) return "border-red-300/60 bg-red-300/10 text-brand-cream";
    return "border-brand-cream/5 bg-white/[0.02] text-brand-cream/35";
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-brand-gold/25 bg-[radial-gradient(circle_at_top,#d6a84b12,transparent_42%),linear-gradient(145deg,#071b24,#11172a)] p-4 shadow-2xl shadow-black/20 sm:p-6" dir="rtl" aria-label="اختبار ZIKR التعليمي">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-[0.18em] text-brand-gold/75">ZIKR QUIZ</p><h3 className="mt-1 text-2xl font-black text-brand-cream">اختبر معلوماتك</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-brand-cream/60">أسئلة موثقة من محتوى الأطفال الحالي، مع نتيجة واضحة وتغذية راجعة مباشرة بعد كل اختيار.</p></div>
        <div className="min-w-48 rounded-2xl border border-brand-cream/10 bg-black/20 p-4"><div className="flex items-center justify-between text-xs text-brand-cream/55"><span>التقدم</span><strong className="text-brand-gold">{index + 1}/{total}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand-gold transition-all duration-300" style={{ width: `${progress}%` }} /></div></div>
      </header>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">النقاط</span><strong className="mt-1 block text-lg text-brand-gold">{liveScore}</strong></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">الصحيح</span><strong className="mt-1 block text-lg text-brand-emerald">{correct}</strong></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">التتابع</span><strong className="mt-1 block text-lg text-violet-300">{streak}</strong></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"><span className="block text-xs text-brand-cream/50">المستوى</span><strong className="mt-1 block text-lg text-brand-cream">{LEVEL[difficulty]}</strong></div>
      </div>
      <div className="mb-5 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.04] p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span className="rounded-full border border-brand-cream/10 px-3 py-1 text-xs text-brand-cream/55">{question.category}</span><span className="text-xs text-brand-cream/40">السؤال {index + 1} من {total}</span></div><h4 className="text-xl font-bold leading-9 text-brand-cream sm:text-2xl">{question.text}</h4></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, optionIndex) => <button key={`${index}-${optionIndex}-${option}`} type="button" onClick={() => choose(optionIndex)} disabled={paused || selected !== null} aria-pressed={selected === optionIndex} className={`min-h-16 rounded-2xl border p-4 text-right text-base font-semibold leading-8 transition duration-200 ${optionClass(optionIndex)} ${paused ? "cursor-not-allowed" : ""}`}><span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/20 text-xs opacity-60">{String.fromCharCode(65 + optionIndex)}</span>{option}</button>)}
      </div>
      <div className={`mt-5 min-h-16 rounded-2xl border px-4 py-3 text-sm leading-7 ${feedback === "correct" ? "border-brand-emerald/30 bg-brand-emerald/[0.07] text-brand-emerald" : feedback === "wrong" ? "border-red-300/25 bg-red-300/[0.05] text-red-100" : "border-brand-cream/10 bg-white/[0.03] text-brand-cream/55"}`} role="status" aria-live="polite">{feedback === "correct" ? "إجابة صحيحة. ممتاز، استمر على نفس التتابع." : feedback === "wrong" ? `ليست الإجابة الصحيحة. الإجابة الصحيحة هي: ${question.options[question.correctAnswer]}` : "اختر إجابة واحدة، وستظهر النتيجة قبل الانتقال للسؤال التالي."}</div>
    </section>
  );
}

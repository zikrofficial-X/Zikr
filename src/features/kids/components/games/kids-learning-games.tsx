"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";
import {
  GameToast,
  KidsGameHeader,
  KidsGameHud,
  KidsGameStage,
  KidsProgress,
  KidCharacter,
  StarToken,
  shuffle,
  formatSeconds,
} from "@/features/kids/components/games/kids-game-kit";
import {
  getVerifiedMemoryPairs,
  getVerifiedWuduContent,
  getVerifiedKidsQuizQuestions,
  type VerifiedQuizQuestion,
} from "@/lib/games/verified-content";
import { getVersePuzzleRules } from "@/lib/games/verse-puzzle";
import {
  isVerseOrderComplete,
  shuffleVerseTokens,
  type IndexedVerseToken,
} from "@/lib/games/gameplay-helpers";

export type LearningGameProps = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

function learningHud(
  score: number,
  collectibles: number,
  combo: number,
  level: number,
  completed = false
): WorldHud {
  return {
    score: Math.max(0, Math.floor(score)),
    collectibles: Math.max(0, Math.floor(collectibles)),
    distance: 0,
    combo: Math.max(0, Math.floor(combo)),
    level,
    completed,
  };
}

type MemoryCard = {
  id: string;
  pairId: string;
  side: "situation" | "dhikr";
  text: string;
};

export function ZikrMemoryGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LearningGameProps) {
  const pairs = getVerifiedMemoryPairs();
  const pairCount = difficulty === "easy" ? 3 : difficulty === "normal" ? 4 : 5;
  const chosenPairs = pairs.slice(0, pairCount);
  const cards = useMemo<MemoryCard[]>(() => {
    const base = chosenPairs.flatMap(pair => [
      { id: pair.id + ":s", pairId: pair.id, side: "situation" as const, text: pair.situation },
      { id: pair.id + ":d", pairId: pair.id, side: "dhikr" as const, text: pair.dhikr },
    ]);
    return shuffle(base, pairCount * 91 + difficulty.length);
  }, [chosenPairs, difficulty, pairCount]);

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("افتح بطاقتين وابحث عن الموقف والذكر المناسبين.");
  const completionRef = useRef(false);

  useEffect(() => {
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setCombo(0);
    setLocked(false);
    setFeedback("افتح بطاقتين وابحث عن الموقف والذكر المناسبين.");
    completionRef.current = false;
    onHud(learningHud(0, 0, 0, pairCount));
  }, [difficulty, onHud, pairCount, restartToken]);

  const complete = matched.length === cards.length && cards.length > 0;
  useEffect(() => {
    if (!complete || completionRef.current) return;
    completionRef.current = true;
    const finalHud = learningHud(score + 500, pairCount, combo, pairCount, true);
    onHud(finalHud);
    onSound("success");
    setFeedback("اكتملت لوحة ذاكرة الأذكار.");
    onResult(finalHud);
  }, [combo, complete, onHud, onResult, onSound, pairCount, score]);

  const choose = (id: string) => {
    if (paused || locked || flipped.includes(id) || matched.includes(id) || complete) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length !== 2) {
      onSound("move");
      return;
    }

    setMoves(value => value + 1);
    const first = cards.find(card => card.id === next[0]);
    const second = cards.find(card => card.id === next[1]);
    if (first && second && first.pairId === second.pairId && first.side !== second.side) {
      const nextCombo = combo + 1;
      const gain = 180 + Math.min(100, nextCombo * 25);
      setMatched(value => [...value, first.id, second.id]);
      setFlipped([]);
      setCombo(nextCombo);
      setScore(value => value + gain);
      onSound("collect");
      setFeedback("تطابق جميل! " + (nextCombo > 1 ? "السلسلة مستمرة." : "اكتشفت الزوج الأول."));
      return;
    }

    setLocked(true);
    setCombo(0);
    onSound("miss");
    setFeedback("جرّب تذكر مكان البطاقة.");
    window.setTimeout(() => {
      setFlipped([]);
      setLocked(false);
    }, difficulty === "hard" ? 850 : 700);
  };

  useEffect(() => {
    onHud(learningHud(score, matched.length / 2, combo, pairCount, complete));
  }, [combo, complete, matched.length, onHud, pairCount, score]);

  return (
    <KidsGameStage theme="night" ariaLabel="ذاكرة ذِكر">
      <KidsGameHeader
        eyebrow="ZIKR MEMORY"
        title="ذاكرة ذِكر"
        description="كل زوج يربط موقفًا يوميًا بذكر موثّق من محتوى الأطفال."
        right={<div className="hidden w-52 sm:block"><KidsProgress value={(matched.length / Math.max(1, cards.length)) * 100} label="لوحة الذاكرة" /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: score, tone: "text-brand-gold" },
            { label: "الأزواج", value: matched.length / 2 + "/" + pairCount, tone: "text-brand-emerald" },
            { label: "المحاولات", value: moves, tone: "text-sky-200" },
            { label: "السلسلة", value: combo, tone: "text-violet-200" },
            { label: "المستوى", value: difficulty, tone: "text-amber-200" },
          ]}
        />
      </div>

      <div className="relative mx-4 mt-4 grid grid-cols-2 gap-3 p-1 sm:grid-cols-3 sm:gap-4 sm:mx-6">
        {cards.map(card => {
          const visible = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              disabled={paused || locked || matched.includes(card.id)}
              onClick={() => choose(card.id)}
              className={[
                "group min-h-36 rounded-[1.5rem] border p-4 text-right transition duration-200",
                visible
                  ? "border-brand-gold/45 bg-brand-gold/10 shadow-[0_12px_30px_rgba(243,201,105,.08)]"
                  : "border-white/10 bg-[#081823]/90 hover:-translate-y-1 hover:border-brand-emerald/40",
                matched.includes(card.id) ? "opacity-55" : "",
              ].join(" ")}
            >
              {visible ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-brand-emerald">
                      {card.side === "situation" ? "موقف" : "ذكر"}
                    </span>
                    <StarToken size={26} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-brand-cream">{card.text}</p>
                </>
              ) : (
                <div className="grid h-full min-h-28 place-items-center text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-brand-gold/20 bg-brand-gold/10 text-2xl text-brand-gold">✦</div>
                    <p className="mt-3 text-xs text-brand-cream/45">بطاقة مخفية</p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <GameToast tone={complete ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type WuduState = {
  order: number[];
  score: number;
  mistakes: number;
  streak: number;
  stepIndex: number;
  completed: boolean;
};

export function WuduChallengeGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LearningGameProps) {
  const content = getVerifiedWuduContent();
  const stepCount = difficulty === "easy" ? Math.min(5, content.steps.length) : difficulty === "normal" ? Math.min(7, content.steps.length) : content.steps.length;
  const steps = content.steps.slice(0, stepCount);
  const [state, setState] = useState<WuduState>({ order: [], score: 0, mistakes: 0, streak: 0, stepIndex: 0, completed: false });
  const [feedback, setFeedback] = useState("اختر الخطوة الصحيحة التالية في الوضوء.");
  const completeRef = useRef(false);

  useEffect(() => {
    setState({ order: [], score: 0, mistakes: 0, streak: 0, stepIndex: 0, completed: false });
    setFeedback("اختر الخطوة الصحيحة التالية في الوضوء.");
    completeRef.current = false;
    onHud(learningHud(0, 0, 0, stepCount));
  }, [difficulty, onHud, restartToken, stepCount]);

  const options = useMemo(() => {
    const correct = steps[state.stepIndex];
    if (!correct) return [];
    const pool = steps.filter(step => step.order !== correct.order);
    const seed = state.stepIndex * 17 + difficulty.length * 5 + restartToken;
    return shuffle([correct, ...pool.slice(0, difficulty === "easy" ? 2 : difficulty === "normal" ? 3 : 4)], seed);
  }, [difficulty, restartToken, state.stepIndex, steps]);

  const choose = (order: number) => {
    if (paused || state.completed) return;
    const correct = steps[state.stepIndex];
    if (!correct) return;
    if (order !== correct.order) {
      onSound("miss");
      setState(prev => ({ ...prev, mistakes: prev.mistakes + 1, streak: 0, score: Math.max(0, prev.score - (difficulty === "hard" ? 60 : difficulty === "normal" ? 30 : 0)) }));
      setFeedback("هذه ليست الخطوة التالية. راجع التسلسل.");
      return;
    }

    const nextIndex = state.stepIndex + 1;
    const nextStreak = state.streak + 1;
    const nextScore = state.score + 180 + Math.min(100, nextStreak * 20);
    onSound("collect");

    if (nextIndex >= steps.length) {
      const finalState = { ...state, order: [...state.order, order], score: nextScore + 500, streak: nextStreak, stepIndex: nextIndex, completed: true };
      setState(finalState);
      const finalHud = learningHud(finalState.score, steps.length, nextStreak, stepCount, true);
      onHud(finalHud);
      if (!completeRef.current) {
        completeRef.current = true;
        setFeedback(content.afterDhikr ? "اكتمل الوضوء. " + content.afterDhikr : "أكملت ترتيب خطوات الوضوء.");
        onSound("success");
        onResult(finalHud);
      }
      return;
    }

    setState(prev => ({
      ...prev,
      order: [...prev.order, order],
      score: nextScore,
      streak: nextStreak,
      stepIndex: nextIndex,
    }));
    setFeedback("صحيح. الآن الخطوة رقم " + (nextIndex + 1) + ".");
  };

  useEffect(() => {
    onHud(learningHud(state.score, state.stepIndex, state.streak, stepCount, state.completed));
  }, [onHud, state, stepCount]);

  const waterLevel = Math.min(100, Math.round((state.stepIndex / Math.max(1, steps.length)) * 100));

  return (
    <KidsGameStage theme="sea" ariaLabel="تحدي الوضوء">
      <KidsGameHeader
        eyebrow="WUDU CHALLENGE"
        title="تحدي الوضوء"
        description="رتّب الخطوات من المحتوى المعتمد، وكل إجابة صحيحة تفتح مشهد الماء التالي."
        right={<div className="hidden w-52 sm:block"><KidsProgress value={waterLevel} label="رحلة الوضوء" /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: state.score, tone: "text-brand-gold" },
            { label: "الخطوة", value: Math.min(stepCount, state.stepIndex) + "/" + stepCount, tone: "text-sky-200" },
            { label: "الأخطاء", value: state.mistakes, tone: "text-rose-100" },
            { label: "السلسلة", value: state.streak, tone: "text-brand-emerald" },
            { label: "المستوى", value: difficulty, tone: "text-violet-200" },
          ]}
        />
      </div>

      <div className="mx-4 mt-4 rounded-[2rem] border border-white/10 bg-[#072530]/70 p-5 sm:mx-6 sm:p-6">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[1.8rem] border border-sky-200/15 bg-[linear-gradient(160deg,#0b4356,#09212d)] p-5">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-sky-400/10 to-transparent" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.18em] text-sky-200/70">محطة الماء</p>
              <h4 className="mt-2 text-2xl font-black text-brand-cream">
                {steps[state.stepIndex]?.text ?? "اكتمل الترتيب"}
              </h4>
              <p className="mt-2 text-sm leading-7 text-brand-cream/55">اختر البطاقة التي تمثل الخطوة التالية.</p>
            </div>
            <div className="relative grid h-24 w-24 place-items-center rounded-full border-2 border-sky-200/40 bg-sky-200/10 text-4xl text-sky-200 shadow-[0_0_35px_rgba(139,182,226,.16)]">
              💧
              <div className="absolute -bottom-2 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-sky-200/15" />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky-300 transition-[width] duration-300" style={{ width: waterLevel + "%" }} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {options.map(option => (
            <button
              key={option.order}
              type="button"
              onClick={() => choose(option.order)}
              disabled={paused || state.completed}
              className="group min-h-24 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-right transition hover:-translate-y-1 hover:border-sky-200/45 hover:bg-sky-200/[0.05]"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200/20 bg-sky-200/10 text-xs font-black text-sky-200">
                {option.order}
              </span>
              <p className="mt-3 text-sm leading-7 text-brand-cream">{option.text}</p>
            </button>
          ))}
        </div>
      </div>
      <GameToast tone={state.completed ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

export function VersePuzzleGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LearningGameProps) {
  const rules = getVersePuzzleRules(difficulty);
  const [tokens, setTokens] = useState<IndexedVerseToken[]>([]);
  const [source, setSource] = useState<{ surah: number; ayah: number } | null>(null);
  const [answer, setAnswer] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("جاري تجهيز النص القرآني...");
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const completionRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAvailable(true);
    setTokens([]);
    setSource(null);
    setAnswer([]);
    setMistakes(0);
    setFeedback("جاري تجهيز النص القرآني...");
    completionRef.current = false;

    fetch("/api/kids/games/verse?difficulty=" + difficulty, { credentials: "include" })
      .then(response => {
        if (!response.ok) throw new Error("unavailable");
        return response.json() as Promise<{ surah?: number; ayah?: number; sourceText?: string; words?: string[] }>;
      })
      .then(data => {
        if (!active) return;
        const words = Array.isArray(data.words) ? data.words.filter(word => typeof word === "string" && word.trim()) : [];
        const sourceText = typeof data.sourceText === "string" ? data.sourceText.trim() : "";
        if (!words.length || !sourceText) {
          setAvailable(false);
          return;
        }
        setSource({
          surah: typeof data.surah === "number" ? data.surah : 1,
          ayah: typeof data.ayah === "number" ? data.ayah : 1,
        });
        setTokens(shuffleVerseTokens(words, difficulty + ":" + restartToken));
        setFeedback("اختر الكلمة التالية في ترتيب الآية.");
      })
      .catch(() => active && setAvailable(false))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [difficulty, restartToken]);

  const complete = tokens.length > 0 && isVerseOrderComplete(answer, tokens.length);
  const score = Math.max(0, answer.length * 220 + (complete ? 500 : 0) - mistakes * rules.mistakePenalty);

  useEffect(() => {
    const hud = learningHud(score, answer.length, Math.max(0, answer.length - mistakes), rules.level, complete);
    onHud(hud);
    if (complete && !completionRef.current) {
      completionRef.current = true;
      onSound("success");
      setFeedback("اكتملت الآية بترتيبها الصحيح.");
      onResult(hud);
    }
  }, [answer.length, complete, mistakes, onHud, onResult, onSound, rules.level, rules.mistakePenalty, score]);

  const choose = (tokenIndex: number) => {
    if (paused || complete || answer.includes(tokenIndex)) return;
    const expected = answer.length;
    if (tokenIndex !== expected) {
      setMistakes(value => value + 1);
      onSound("miss");
      if (rules.resetOnMistake) setAnswer([]);
      setFeedback(
        rules.resetOnMistake
          ? "إجابة غير صحيحة. هذا المستوى يعيد الترتيب من البداية."
          : rules.tolerateMistakes
            ? "اختيار غير صحيح. حاول الكلمة التالية."
            : "ركز على تسلسل الكلمات."
      );
      return;
    }
    onSound("collect");
    setAnswer(value => [...value, tokenIndex]);
    setFeedback("اختيار صحيح.");
  };

  if (loading) {
    return <div className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/20 bg-[#071b24] text-brand-cream/70">جاري تجهيز نص قرآني موثق...</div>;
  }

  if (!available || !source || tokens.length === 0) {
    return <div className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/20 bg-[#071b24] p-6 text-center text-brand-cream/70">لا يتوفر نص قرآني موثق للعبة حاليًا.</div>;
  }

  return (
    <KidsGameStage theme="library" ariaLabel="لغز الآية">
      <KidsGameHeader
        eyebrow="VERSE PUZZLE"
        title="لغز الآية"
        description="كل كلمة تأتي من النص الموثق نفسه، مع الحفاظ على هوية الكلمات المكررة."
        right={<div className="hidden w-52 sm:block"><KidsProgress value={(answer.length / tokens.length) * 100} label={"الآية " + source.surah + ":" + source.ayah} /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: score, tone: "text-brand-gold" },
            { label: "الكلمات", value: answer.length + "/" + tokens.length, tone: "text-violet-200" },
            { label: "الأخطاء", value: mistakes, tone: "text-rose-100" },
            { label: "السلسلة", value: Math.max(0, answer.length - mistakes), tone: "text-brand-emerald" },
            { label: "المستوى", value: rules.level, tone: "text-amber-200" },
          ]}
        />
      </div>

      <div className="mx-4 mt-4 rounded-[2rem] border border-violet-200/10 bg-black/20 p-5 sm:mx-6">
        <div className="min-h-28 rounded-[1.5rem] border border-violet-200/15 bg-violet-200/[0.04] p-5 text-center text-xl leading-[2.5] text-brand-gold">
          {answer.length
            ? answer.map(index => tokens.find(token => token.index === index)?.text ?? "").join(" ")
            : <span className="text-sm text-brand-cream/30">ابدأ من الكلمة الأولى</span>}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {tokens.map(token => {
            const selected = answer.includes(token.index);
            return (
              <button
                key={token.id}
                type="button"
                onClick={() => choose(token.index)}
                disabled={paused || selected || complete}
                className={
                  "min-h-16 rounded-2xl border p-4 text-right text-base font-semibold transition " +
                  (selected
                    ? "border-brand-emerald/20 bg-brand-emerald/5 text-brand-cream/20"
                    : "border-white/10 bg-white/[0.03] text-brand-cream hover:-translate-y-0.5 hover:border-violet-200/50")
                }
              >
                {token.text}
              </button>
            );
          })}
        </div>
      </div>
      <GameToast tone={complete ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

export function ZikrQuizGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LearningGameProps) {
  const allQuestions = getVerifiedKidsQuizQuestions();
  const count = difficulty === "hard" ? 10 : difficulty === "normal" ? 7 : 5;
  const questions = allQuestions.slice(0, Math.min(count, allQuestions.length));
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [feedback, setFeedback] = useState("اقرأ السؤال ثم اختر الإجابة.");
  const completionRef = useRef(false);

  useEffect(() => {
    setIndex(0);
    setCorrect(0);
    setStreak(0);
    setSelected(null);
    setSeconds(0);
    setFeedback("اقرأ السؤال ثم اختر الإجابة.");
    completionRef.current = false;
  }, [difficulty, restartToken]);

  useEffect(() => {
    if (paused || selected !== null || index >= questions.length) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [index, paused, questions.length, selected]);

  const question: VerifiedQuizQuestion | undefined = questions[index];
  const score = correct * 280 + streak * 60;
  const complete = question === undefined && questions.length > 0;

  useEffect(() => {
    const hud = learningHud(score, correct, streak, difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1, complete);
    onHud(hud);
    if (complete && !completionRef.current) {
      completionRef.current = true;
      onSound("success");
      setFeedback("انتهى الاختبار. راجع نتيجتك ثم أعد المحاولة.");
      onResult(hud);
    }
  }, [complete, correct, difficulty, onHud, onResult, onSound, score, streak]);

  if (!question) {
    return (
      <KidsGameStage theme="library" ariaLabel="اختبار ذِكر">
        <KidsGameHeader eyebrow="ZIKR QUIZ" title="اختبار ذِكر" description="جولة معرفية قصيرة من المحتوى الموثق." />
        <div className="mx-4 rounded-[2rem] border border-brand-gold/20 bg-black/20 p-8 text-center sm:mx-6">
          <KidCharacter variant="reader" state="celebrate" size={92} />
          <h4 className="mt-3 text-3xl font-black text-brand-cream">انتهت الجولة</h4>
          <p className="mt-2 text-brand-cream/60">أجبت بشكل صحيح عن {correct} من {questions.length}.</p>
        </div>
        <GameToast tone="emerald">{feedback}</GameToast>
      </KidsGameStage>
    );
  }

  const choose = (answer: number) => {
    if (paused || selected !== null) return;
    const isCorrect = answer === question.correctAnswer;
    setSelected(answer);
    if (isCorrect) {
      setCorrect(value => value + 1);
      setStreak(value => value + 1);
      onSound("success");
      setFeedback("إجابة صحيحة. حافظ على السلسلة!");
    } else {
      setStreak(0);
      onSound("miss");
      setFeedback("ليست الإجابة الصحيحة. الإجابة المعتمدة ظاهرة الآن.");
    }
    window.setTimeout(() => {
      setSelected(null);
      setIndex(value => value + 1);
    }, 750);
  };

  return (
    <KidsGameStage theme="library" ariaLabel="اختبار ذِكر">
      <KidsGameHeader
        eyebrow="ZIKR QUIZ"
        title="اختبار ذِكر"
        description={question.category + " • خذ وقتك واقرأ السؤال جيدًا."}
        right={<div className="hidden w-52 sm:block"><KidsProgress value={(index / questions.length) * 100} label={"السؤال " + (index + 1) + " من " + questions.length} /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: score, tone: "text-brand-gold" },
            { label: "الصحيح", value: correct, tone: "text-brand-emerald" },
            { label: "السلسلة", value: streak, tone: "text-violet-200" },
            { label: "الوقت", value: formatSeconds(seconds), tone: "text-sky-200" },
            { label: "التقدم", value: index + "/" + questions.length, tone: "text-amber-200" },
          ]}
        />
      </div>

      <div className="mx-4 mt-4 rounded-[2rem] border border-white/10 bg-black/20 p-5 sm:mx-6 sm:p-7">
        <div className="rounded-[1.7rem] border border-brand-gold/15 bg-brand-gold/[0.04] p-5">
          <p className="text-xs font-black tracking-[0.18em] text-brand-emerald/80">السؤال {index + 1}</p>
          <h4 className="mt-3 text-2xl font-black leading-10 text-brand-cream">{question.text}</h4>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.correctAnswer;
            const isSelected = optionIndex === selected;
            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(optionIndex)}
                disabled={selected !== null}
                className={[
                  "min-h-24 rounded-2xl border p-4 text-right transition",
                  isSelected
                    ? isCorrect
                      ? "border-brand-emerald bg-brand-emerald/15 text-brand-emerald"
                      : "border-rose-300/35 bg-rose-300/10 text-rose-100"
                    : selected !== null && isCorrect
                      ? "border-brand-emerald/60 bg-brand-emerald/10 text-brand-emerald"
                      : "border-white/10 bg-white/[0.03] text-brand-cream hover:-translate-y-0.5 hover:border-brand-gold/45",
                ].join(" ")}
              >
                <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs text-brand-cream/60">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <p className="leading-7">{option}</p>
              </button>
            );
          })}
        </div>
      </div>
      <GameToast tone={selected === question.correctAnswer ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

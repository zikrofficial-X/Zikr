"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/layout/language-provider";
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
  formatSeconds,
} from "@/features/kids/components/games/kids-game-kit";
import {
  getVerifiedMemoryPairs,
  getVerifiedWuduContent,
  getVerifiedKidsQuizQuestions,
} from "@/lib/games/verified-content";
import { getVersePuzzleRules, getVersePuzzleLevelSeed } from "@/lib/games/verse-puzzle";
import { isVerseOrderComplete, seededShuffle, shuffleVerseTokens, type IndexedVerseToken } from "@/lib/games/gameplay-helpers";
import { getKidsLevelMeta, KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";
import { accumulateGameLevel, createGameRunTotals } from "@/lib/games/run-stats";
import { KidsGameWorld } from "@/features/kids/components/games/kids-game-visuals";

export type LearningGameProps = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

const levelLabel = (levelIndex: number, isEnglish = false) => isEnglish ? "Level " + (levelIndex + 1) + "/" + KIDS_LEVEL_COUNT : "المستوى " + (levelIndex + 1) + "/" + KIDS_LEVEL_COUNT;

function learningHud(score: number, collectibles: number, combo: number, levelIndex: number, completed = false): WorldHud {
  return {
    score: Math.max(0, Math.floor(score)),
    collectibles: Math.max(0, Math.floor(collectibles)),
    distance: 0,
    combo: Math.max(0, Math.floor(combo)),
    level: Math.min(KIDS_LEVEL_COUNT, levelIndex + 1),
    completed,
  };
}

type MemoryCard = {
  id: string;
  pairId: string;
  side: "situation" | "dhikr";
  text: string;
};

const MEMORY_SITUATIONS_EN: Record<string, string> = {
  "before-sleep": "Before sleeping",
  "before-food": "Before eating",
  "after-food": "After eating",
  "after-sneeze": "After sneezing",
  "enter-home": "When entering home",
  "wake-up": "When waking up",
  "leave-home": "When leaving home",
  "enter-mosque": "When entering the mosque",
  "leave-mosque": "When leaving the mosque",
  "feel-angry": "When feeling angry",
  "rain-falls": "When it rains",
};

export function ZikrMemoryGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: LearningGameProps) {
  const { isEnglish } = useLanguage();
  const isEnglishRef = useRef(isEnglish);
  useEffect(() => { isEnglishRef.current = isEnglish; }, [isEnglish]);
  const pairs = useMemo(() => getVerifiedMemoryPairs(), []);
  const [levelIndex, setLevelIndex] = useState(0);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [locked, setLocked] = useState(false);
  const [hintId, setHintId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(isEnglish ? "Turn over two cards and match each situation to its dhikr." : "افتح بطاقتين وابحث عن الموقف والذكر المناسبين.");
  const completionRef = useRef(false);
  const advancingRef = useRef(false);
  const runTotalsRef = useRef(createGameRunTotals());
  const levelResetPendingRef = useRef(false);

  useEffect(() => {
    runTotalsRef.current = createGameRunTotals();
    setLevelIndex(0);
  }, [difficulty, restartToken]);

  const meta = getKidsLevelMeta("zikr-memory", difficulty, levelIndex);
  const pairTarget = Math.max(2, Math.min(pairs.length, (difficulty === "easy" ? 3 : difficulty === "normal" ? 4 : 5) + (levelIndex % 2)));
  const chosenPairs = useMemo(() => {
    // Two different situations can share the same dhikr text (e.g. after food / after sneezing).
    // Keep only one of them per board so identical-looking cards never need different partners.
    const seenDhikr = new Set<string>();
    return seededShuffle(pairs, String(meta.seed))
      .filter(pair => {
        const key = pair.dhikr.trim();
        if (seenDhikr.has(key)) return false;
        seenDhikr.add(key);
        return true;
      })
      .slice(0, pairTarget);
  }, [meta.seed, pairTarget, pairs]);
  const cards = useMemo<MemoryCard[]>(() => {
    const base = chosenPairs.flatMap(pair => [
      { id: pair.id + ":s", pairId: pair.id, side: "situation" as const, text: pair.situation },
      { id: pair.id + ":d", pairId: pair.id, side: "dhikr" as const, text: pair.dhikr },
    ]);
    return seededShuffle(base, "memory-layout:" + meta.seed);
  }, [chosenPairs, meta.seed]);

  useEffect(() => {
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setScore(0);
    setCombo(0);
    setLocked(false);
    setHintId(null);
    setFeedback(isEnglishRef.current ? meta.subtitleEn : meta.subtitleAr);
    levelResetPendingRef.current = true;
    completionRef.current = false;
    advancingRef.current = false;
    onHud(learningHud(0, 0, 0, levelIndex));
  }, [difficulty, levelIndex, meta.subtitleAr, meta.subtitleEn, onHud, restartToken]);

  useEffect(() => { setFeedback(isEnglish ? "Turn over two cards and match each situation to its dhikr." : "افتح بطاقتين وابحث عن الموقف والذكر المناسبين."); }, [isEnglish]);

  const complete = matched.length === cards.length && cards.length > 0;

  const useHint = () => {
    if (paused || locked || complete || hintId) return;
    const unmatched = cards.find(card => !matched.includes(card.id));
    if (!unmatched) return;
    setHintId(unmatched.pairId);
    setScore(value => Math.max(0, value - 35));
    setFeedback(isEnglish ? "Hint: the highlighted cards belong to the same pair." : "تلميح صغير: البطاقتان المظللتان تنتميان إلى نفس الزوج.");
    onSound("move");
    window.setTimeout(() => setHintId(null), difficulty === "hard" ? 900 : 1300);
  };

  useEffect(() => {
    if (levelResetPendingRef.current) {
      levelResetPendingRef.current = false;
      return;
    }
    if (!complete || completionRef.current || advancingRef.current) return;
    completionRef.current = true;
    const finalScore = score + 500;
    const totals = accumulateGameLevel(runTotalsRef.current, { score: finalScore, collectibles: pairTarget, combo });
    runTotalsRef.current = totals;
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      advancingRef.current = true;
      setFeedback(isEnglishRef.current ? "Level " + (levelIndex + 1) + "/" + KIDS_LEVEL_COUNT + " complete. A new board is ready..." : "اكتمل المستوى " + (levelIndex + 1) + ". جهّزنا لك لوحة مختلفة...");
      onSound("success");
      window.setTimeout(() => {
        setLevelIndex(value => value + 1);
      }, 650);
    } else {
      const hud = learningHud(totals.score, totals.collectibles, totals.bestCombo, levelIndex, true);
      onHud(hud);
      onSound("success");
      setFeedback(isEnglishRef.current ? "You completed every Memory level." : "أكملت جميع مستويات ذاكرة ذِكر.");
      onResult(hud);
    }
  }, [complete, combo, levelIndex, onHud, onResult, onSound, pairTarget, score]);

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
      setMatched(value => [...value, first.id, second.id]);
      setFlipped([]);
      setCombo(nextCombo);
      setScore(value => value + 180 + Math.min(100, nextCombo * 25));
      onSound("collect");
      setFeedback(isEnglish ? "Great match! " + (nextCombo > 1 ? "Your streak continues." : "You found your first pair.") : "تطابق جميل! " + (nextCombo > 1 ? "السلسلة مستمرة." : "اكتشفت الزوج الأول."));
      return;
    }
    setLocked(true);
    setCombo(0);
    onSound("miss");
    setFeedback(isEnglish ? "Try to remember where each card is." : "جرّب تذكر مكان البطاقة.");
    window.setTimeout(() => {
      setFlipped([]);
      setLocked(false);
    }, difficulty === "hard" ? 700 : 520);
  };

  useEffect(() => {
    onHud(learningHud(score, matched.length / 2, combo, levelIndex, complete && levelIndex === KIDS_LEVEL_COUNT - 1));
  }, [combo, complete, levelIndex, matched.length, onHud, score]);

  return (
    <KidsGameStage theme="night" ariaLabel={isEnglish ? "ZIKR Memory" : "ذاكرة ذِكر"}><KidsGameWorld gameId="zikr-memory" />
      <KidsGameHeader eyebrow="ZIKR MEMORY" title={isEnglish ? "ZIKR Memory" : "ذاكرة ذِكر"} description={isEnglish ? "Match everyday situations to verified Arabic dhikr." : meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={(matched.length / Math.max(1, cards.length)) * 100} label={isEnglish ? "Pairs " + matched.length / 2 + "/" + pairTarget : "الأزواج " + matched.length / 2 + "/" + pairTarget} /></div>} />
      <div className="px-4 sm:px-6">
        {isEnglish && <p className="mb-3 text-xs text-brand-cream/45">Dhikr phrases remain in their verified Arabic wording.</p>}
        <KidsGameHud items={[
          { label: isEnglish ? "Score" : "النقاط", value: score, tone: "text-brand-gold" },
          { label: isEnglish ? "Pairs" : "الأزواج", value: matched.length / 2 + "/" + pairTarget, tone: "text-brand-emerald" },
          { label: isEnglish ? "Moves" : "المحاولات", value: moves, tone: "text-sky-200" },
          { label: isEnglish ? "Streak" : "السلسلة", value: combo, tone: "text-violet-200" },
          { label: isEnglish ? "Level" : "المستوى", value: levelIndex + 1, tone: "text-amber-200" },
        ]} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-brand-cream/45">{isEnglish ? "The hint costs 35 points and briefly highlights a matching pair." : "التلميح يخصم 35 نقطة ويكشف الزوج بصريًا للحظات."}</p>
          <button type="button" onClick={useHint} disabled={paused || locked || complete || Boolean(hintId)} className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 px-4 py-2 text-xs font-black text-brand-gold disabled:opacity-40">💡 {isEnglish ? "Hint" : "تلميح"}</button>
        </div>
      </div>
      <div className="relative mx-4 mt-4 grid grid-cols-2 gap-3 p-1 sm:mx-6 sm:grid-cols-3 sm:gap-4">
        {cards.map((card, index) => {
          const visible = flipped.includes(card.id) || matched.includes(card.id);
          const cardText = isEnglish && card.side === "situation"
            ? (MEMORY_SITUATIONS_EN[card.pairId] ?? card.text)
            : card.text;
          const cardAccessibleLabel = visible
            ? card.side === "situation"
              ? (isEnglish ? "Situation: " + cardText : "موقف: " + cardText)
              : (isEnglish ? "Dhikr: " + cardText : "ذكر: " + cardText)
            : hintId === card.pairId
              ? (isEnglish ? "Card " + (index + 1) + ", hint: matching pair" : "البطاقة " + (index + 1) + "، تلميح: ضمن الزوج")
              : (isEnglish ? "Card " + (index + 1) + ", hidden" : "البطاقة " + (index + 1) + "، مخفية");
          return (
            <button key={card.id} type="button" aria-label={cardAccessibleLabel} aria-pressed={visible} disabled={paused || locked || matched.includes(card.id)} onClick={() => choose(card.id)}
              className={[
                "group min-h-36 rounded-[1.5rem] border p-4 " + (isEnglish && card.side === "situation" ? "text-left" : "text-right") + " transition duration-200",
                visible ? "border-brand-gold/45 bg-brand-gold/10 shadow-[0_12px_30px_rgba(243,201,105,.08)]" : hintId === card.pairId ? "border-brand-gold/80 bg-brand-gold/5 ring-2 ring-brand-gold/20 animate-pulse" : "border-white/10 bg-[#081823]/90 hover:-translate-y-1 hover:border-brand-emerald/40",
                matched.includes(card.id) ? "opacity-55" : "",
              ].join(" ")}>
              {visible ? <>
                <div className="flex items-center justify-between"><span className="text-xs font-black text-brand-emerald">{card.side === "situation" ? (isEnglish ? "Situation" : "موقف") : (isEnglish ? "Dhikr" : "ذكر")}</span><StarToken size={26} /></div>
                <p className="mt-4 text-sm leading-7 text-brand-cream">{cardText}</p>
              </> : <div className="grid h-full min-h-28 place-items-center text-center"><div><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-brand-gold/20 bg-brand-gold/10 text-2xl text-brand-gold">✦</div><p className="mt-3 text-xs text-brand-cream/45">{isEnglish ? "Hidden card" : "بطاقة مخفية"}</p></div></div>}
            </button>
          );
        })}
      </div>
      <GameToast tone={complete && levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type WuduState = { order: number[]; score: number; mistakes: number; streak: number; stepIndex: number; completed: boolean };

export function WuduChallengeGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: LearningGameProps) {
  const { isEnglish } = useLanguage();
  const isEnglishRef = useRef(isEnglish);
  useEffect(() => { isEnglishRef.current = isEnglish; }, [isEnglish]);
  const content = getVerifiedWuduContent();
  const baseCount = difficulty === "easy" ? Math.min(5, content.steps.length) : difficulty === "normal" ? Math.min(7, content.steps.length) : content.steps.length;
  const [levelIndex, setLevelIndex] = useState(0);
  const [state, setState] = useState<WuduState>({ order: [], score: 0, mistakes: 0, streak: 0, stepIndex: 0, completed: false });
  const [feedback, setFeedback] = useState(isEnglish ? "Choose the next correct wudu step." : "اختر الخطوة الصحيحة التالية في الوضوء.");
  const completionRef = useRef(false);
  const advancingRef = useRef(false);
  const runTotalsRef = useRef(createGameRunTotals());

  useEffect(() => {
    runTotalsRef.current = createGameRunTotals();
    setLevelIndex(0);
  }, [difficulty, restartToken]);
  const meta = getKidsLevelMeta("wudu-challenge", difficulty, levelIndex);
  const stepCount = Math.max(3, Math.min(content.steps.length, baseCount + (levelIndex % 2)));
  const steps = useMemo(() => content.steps.slice(0, stepCount), [content.steps, stepCount]);

  useEffect(() => {
    setState({ order: [], score: 0, mistakes: 0, streak: 0, stepIndex: 0, completed: false });
    setFeedback(isEnglishRef.current ? meta.subtitleEn : meta.subtitleAr);
    completionRef.current = false;
    advancingRef.current = false;
    onHud(learningHud(0, 0, 0, levelIndex));
  }, [difficulty, levelIndex, meta.subtitleAr, meta.subtitleEn, onHud, restartToken, stepCount]);

  useEffect(() => { setFeedback(isEnglish ? "Choose the next correct wudu step." : "اختر الخطوة الصحيحة التالية في الوضوء."); }, [isEnglish]);

  const options = useMemo(() => {
    const correct = steps[state.stepIndex];
    if (!correct) return [];
    const pool = steps.filter(step => step.order !== correct.order);
    return seededShuffle([correct, ...pool], "wudu-options:" + meta.seed + ":" + state.stepIndex).slice(0, difficulty === "easy" ? 3 : difficulty === "normal" ? 4 : 5);
  }, [difficulty, meta.seed, state.stepIndex, steps]);

  const choose = (order: number) => {
    if (paused || state.completed) return;
    const correct = steps[state.stepIndex];
    if (!correct) return;
    if (order !== correct.order) {
      setState(prev => ({ ...prev, mistakes: prev.mistakes + 1, streak: 0, score: Math.max(0, prev.score - (difficulty === "hard" ? 60 : difficulty === "normal" ? 25 : 0)) }));
      onSound("miss");
      setFeedback(isEnglish ? "That is not the next step. Review the sequence." : "هذه ليست الخطوة التالية. راجع التسلسل.");
      return;
    }
    const nextIndex = state.stepIndex + 1;
    const nextStreak = state.streak + 1;
    const nextScore = state.score + 180 + Math.min(100, nextStreak * 20);
    onSound("collect");
    if (nextIndex >= steps.length) {
      const finalScore = nextScore + 500;
      setState(prev => ({ ...prev, order: [...prev.order, order], score: finalScore, streak: nextStreak, stepIndex: nextIndex, completed: true }));
      if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
        runTotalsRef.current = accumulateGameLevel(runTotalsRef.current, { score: finalScore, collectibles: steps.length, combo: nextStreak });
        advancingRef.current = true;
        setFeedback(isEnglish ? "Level " + (levelIndex + 1) + "/" + KIDS_LEVEL_COUNT + " complete. A new water station is ahead..." : "اكتمل المستوى " + (levelIndex + 1) + ". محطة ماء جديدة في الطريق...");
        onSound("success");
        window.setTimeout(() => setLevelIndex(value => value + 1), 650);
      } else {
        const totals = accumulateGameLevel(runTotalsRef.current, { score: finalScore, collectibles: steps.length, combo: nextStreak });
        runTotalsRef.current = totals;
        const hud = learningHud(totals.score, totals.collectibles, totals.bestCombo, levelIndex, true);
        onHud(hud);
        onSound("success");
        setFeedback(content.afterDhikr ? (isEnglish ? "Journey complete. The verified completion dhikr is shown in Arabic: " : "اكتملت الرحلة. ") + content.afterDhikr : (isEnglish ? "You completed every Wudu level." : "أكملت جميع مستويات تحدي الوضوء."));
        onResult(hud);
      }
      return;
    }
    setState(prev => ({ ...prev, order: [...prev.order, order], score: nextScore, streak: nextStreak, stepIndex: nextIndex }));
    setFeedback(isEnglish ? "Correct. Now choose step " + (nextIndex + 1) + "." : "صحيح. الآن الخطوة رقم " + (nextIndex + 1) + ".");
  };

  useEffect(() => {
    onHud(learningHud(state.score, state.stepIndex, state.streak, levelIndex, state.completed && levelIndex === KIDS_LEVEL_COUNT - 1));
  }, [levelIndex, onHud, state]);

  const waterLevel = Math.min(100, Math.round((state.stepIndex / Math.max(1, steps.length)) * 100));

  return (
    <KidsGameStage theme="sea" ariaLabel={isEnglish ? "Wudu Challenge" : "تحدي الوضوء"}><KidsGameWorld gameId="wudu-challenge" />
      <KidsGameHeader eyebrow="WUDU CHALLENGE" title={isEnglish ? "Wudu Challenge" : "تحدي الوضوء"} description={isEnglish ? "Order the verified Arabic wudu steps from the lesson." : meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={waterLevel} label={levelLabel(levelIndex, isEnglish)} /></div>} />
      <div className="px-4 sm:px-6">{isEnglish && <p className="mb-3 text-xs text-brand-cream/45">Step wording remains in the verified Arabic source.</p>}<KidsGameHud items={[
        { label: isEnglish ? "Score" : "النقاط", value: state.score, tone: "text-brand-gold" },
        { label: isEnglish ? "Step" : "الخطوة", value: Math.min(stepCount, state.stepIndex) + "/" + stepCount, tone: "text-sky-200" },
        { label: isEnglish ? "Mistakes" : "الأخطاء", value: state.mistakes, tone: "text-rose-100" },
        { label: isEnglish ? "Streak" : "السلسلة", value: state.streak, tone: "text-brand-emerald" },
        { label: isEnglish ? "Level" : "المستوى", value: levelIndex + 1, tone: "text-violet-200" },
      ]} /></div>
      <div className="mx-4 mt-4 rounded-[2rem] border border-white/10 bg-[#072530]/70 p-5 sm:mx-6 sm:p-6">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={isEnglish ? "Wudu step sequence" : "تسلسل خطوات الوضوء"}>
          {steps.map((step, index) => <div key={step.order} className={"rounded-xl border px-3 py-2 text-xs transition " + (index < state.stepIndex ? "border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald" : index === state.stepIndex ? "border-sky-200/40 bg-sky-200/10 text-sky-100" : "border-white/10 bg-white/[0.02] text-brand-cream/35")}>
            <span className="block font-black">{index + 1}</span><span className="mt-1 block truncate">{step.text}</span>
          </div>)}
        </div>
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[1.8rem] border border-sky-200/15 bg-[linear-gradient(160deg,#0b4356,#09212d)] p-5">
          <div className="relative flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black tracking-[0.18em] text-sky-200/70">{isEnglish ? "WATER STATION" : "محطة الماء"}</p><h4 className="mt-2 text-2xl font-black text-brand-cream">{steps[state.stepIndex]?.text ?? (isEnglish ? "Level complete" : "اكتمل المستوى")}</h4><p className="mt-2 text-sm leading-7 text-brand-cream/55">{isEnglish ? "Choose the card that represents the next step." : "اختر البطاقة التي تمثل الخطوة التالية."}</p></div><div className="grid h-24 w-24 place-items-center rounded-full border-2 border-sky-200/40 bg-sky-200/10 text-4xl text-sky-200">💧</div></div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky-300 transition-[width] duration-300" style={{ width: waterLevel + "%" }} /></div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {options.map(option => <button key={option.order} type="button" onClick={() => choose(option.order)} disabled={paused || state.completed} className={"group min-h-24 rounded-2xl border border-white/10 bg-white/[0.03] p-4 " + (isEnglish ? "text-left" : "text-right") + " transition hover:-translate-y-1 hover:border-sky-200/45"}><span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sky-200/20 bg-sky-200/10 text-xs font-black text-sky-200">{option.order}</span><p className="mt-3 text-sm leading-7 text-brand-cream">{option.text}</p></button>)}
        </div>
      </div>
      <GameToast tone={state.completed && levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

export function VersePuzzleGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: LearningGameProps) {
  const { isEnglish } = useLanguage();
  const isEnglishRef = useRef(isEnglish);
  useEffect(() => { isEnglishRef.current = isEnglish; }, [isEnglish]);
  const rules = getVersePuzzleRules(difficulty);
  const [levelIndex, setLevelIndex] = useState(0);
  const [tokens, setTokens] = useState<IndexedVerseToken[]>([]);
  const [source, setSource] = useState<{ surah: number; ayah: number } | null>(null);
  const [baseWords, setBaseWords] = useState<string[]>([]);
  const [answer, setAnswer] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState(isEnglish ? "Loading verified Quran text..." : "جاري تجهيز النص القرآني...");
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [hintVisible, setHintVisible] = useState(false);
  const completionRef = useRef(false);
  const runTotalsRef = useRef(createGameRunTotals());
  const levelResetPendingRef = useRef(false);

  useEffect(() => {
    setLevelIndex(0);
    runTotalsRef.current = createGameRunTotals();
  }, [difficulty, restartToken]);

  useEffect(() => {
    let active = true;
    levelResetPendingRef.current = true;
    setLoading(true);
    setAvailable(true);
    setSource(null);
    setBaseWords([]);
    setTokens([]);
    setAnswer([]);
    setMistakes(0);
    setHintVisible(false);
    setFeedback(isEnglishRef.current ? "Loading verified Quran text..." : "جاري تجهيز النص القرآني...");
    completionRef.current = false;

    fetch("/api/kids/games/verse?difficulty=" + difficulty + "&level=" + levelIndex, { credentials: "include" })
      .then(response => { if (!response.ok) throw new Error("unavailable"); return response.json() as Promise<{ surah?: number; ayah?: number; sourceText?: string; words?: string[] }>; })
      .then(data => {
        if (!active) return;
        const words = Array.isArray(data.words) ? data.words.filter(word => typeof word === "string" && word.trim()) : [];
        if (!words.length || typeof data.sourceText !== "string" || !data.sourceText.trim()) { setAvailable(false); return; }
        setSource({ surah: typeof data.surah === "number" ? data.surah : 1, ayah: typeof data.ayah === "number" ? data.ayah : 1 });
        setBaseWords(words);
        setFeedback(isEnglishRef.current ? "Choose the next word in the verse." : "اختر الكلمة التالية في ترتيب الآية.");
      })
      .catch(() => active && setAvailable(false))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [difficulty, levelIndex, restartToken]);

  const meta = getKidsLevelMeta("verse-puzzle", difficulty, levelIndex);

  useEffect(() => {
    if (!baseWords.length) return;
    setTokens(shuffleVerseTokens(baseWords, String(getVersePuzzleLevelSeed(difficulty, levelIndex)) + ":" + restartToken));
    setAnswer([]);
    setMistakes(0);
    setHintVisible(false);
    setFeedback(isEnglishRef.current ? meta.subtitleEn : meta.subtitleAr);
    completionRef.current = false;
  }, [baseWords, difficulty, levelIndex, meta.subtitleAr, meta.subtitleEn, restartToken]);

  useEffect(() => { setFeedback(isEnglish ? "Choose the next word in the verse." : "اختر الكلمة التالية في ترتيب الآية."); }, [isEnglish]);

  const complete = tokens.length > 0 && isVerseOrderComplete(answer, tokens.length);
  const score = Math.max(0, answer.length * 220 + (complete ? 500 : 0) - mistakes * rules.mistakePenalty);

  useEffect(() => {
    const levelHud = learningHud(score, answer.length, Math.max(0, answer.length - mistakes), levelIndex, complete && levelIndex === KIDS_LEVEL_COUNT - 1);
    onHud(levelHud);
    if (levelResetPendingRef.current) {
      levelResetPendingRef.current = false;
      return;
    }
    if (!complete || completionRef.current) return;
    completionRef.current = true;
    const levelTotals = { score: levelHud.score, collectibles: levelHud.collectibles, combo: levelHud.combo };
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      runTotalsRef.current = accumulateGameLevel(runTotalsRef.current, levelTotals);
      onSound("success");
      setFeedback(isEnglishRef.current ? "Level " + (levelIndex + 1) + "/" + KIDS_LEVEL_COUNT + " complete. A new word order is ready..." : "أكملت المستوى " + (levelIndex + 1) + ". ترتيب جديد للكلمات جاهز...");
      window.setTimeout(() => setLevelIndex(value => value + 1), 650);
    } else {
      const totals = accumulateGameLevel(runTotalsRef.current, levelTotals);
      runTotalsRef.current = totals;
      const finalHud = learningHud(totals.score, totals.collectibles, totals.bestCombo, levelIndex, true);
      onHud(finalHud);
      onSound("success");
      setFeedback(isEnglishRef.current ? "You completed every Verse Puzzle level." : "أكملت جميع مستويات لغز الآية.");
      onResult(finalHud);
    }
  }, [answer.length, complete, levelIndex, mistakes, onHud, onResult, onSound, rules.mistakePenalty, score]);

  const useVerseHint = () => {
    if (paused || complete || hintVisible || answer.length >= tokens.length) return;
    setHintVisible(true);
    setMistakes(value => value + 1);
    setFeedback(isEnglish ? "Hint: focus on the next word in the text." : "التلميح: ركّز على الكلمة التالية في ترتيب النص.");
    onSound("move");
    window.setTimeout(() => setHintVisible(false), 1400);
  };

  const choose = (tokenIndex: number) => {
    if (paused || complete || answer.includes(tokenIndex)) return;
    const expected = answer.length;
    if (tokenIndex !== expected) {
      setMistakes(value => value + 1);
      onSound("miss");
      if (rules.resetOnMistake) setAnswer([]);
      setFeedback(isEnglish ? (rules.resetOnMistake ? "Incorrect. Rebuild the order from the beginning." : "Not quite. Try the next word.") : (rules.resetOnMistake ? "إجابة غير صحيحة. أعد الترتيب من البداية." : "اختيار غير صحيح. حاول الكلمة التالية."));
      return;
    }
    setAnswer(value => [...value, tokenIndex]);
    onSound("collect");
    setFeedback(isEnglish ? "Correct choice." : "اختيار صحيح.");
  };

  if (loading) return <div className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/20 bg-[#071b24] text-brand-cream/70">{isEnglish ? "Loading verified Quran text..." : "جاري تجهيز نص قرآني موثق..."}</div>;
  if (!available || !source || !baseWords.length) return <div className="grid min-h-[320px] place-items-center rounded-3xl border border-brand-gold/20 bg-[#071b24] p-6 text-center text-brand-cream/70">{isEnglish ? "No verified Quran text is available for this game right now." : "لا يتوفر نص قرآني موثق للعبة حاليًا."}</div>;

  return (
    <KidsGameStage theme="library" ariaLabel={isEnglish ? "Verse Puzzle" : "لغز الآية"}><KidsGameWorld gameId="verse-puzzle" />
      <KidsGameHeader eyebrow="VERSE PUZZLE" title={isEnglish ? "Verse Puzzle" : "لغز الآية"} description={isEnglish ? "Rebuild the verified Quran text in its original Arabic wording." : meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={(answer.length / tokens.length) * 100} label={levelLabel(levelIndex, isEnglish)} /></div>} />
      <div className="px-4 sm:px-6"><KidsGameHud items={[
        { label: isEnglish ? "Score" : "النقاط", value: score, tone: "text-brand-gold" },
        { label: isEnglish ? "Words" : "الكلمات", value: answer.length + "/" + tokens.length, tone: "text-violet-200" },
        { label: isEnglish ? "Mistakes" : "الأخطاء", value: mistakes, tone: "text-rose-100" },
        { label: isEnglish ? "Streak" : "السلسلة", value: Math.max(0, answer.length - mistakes), tone: "text-brand-emerald" },
        { label: isEnglish ? "Level" : "المستوى", value: levelIndex + 1, tone: "text-amber-200" },
      ]} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-brand-cream/45">{isEnglish ? "The hint adds one mistake but points toward the next word." : "التلميح يضيف خطأً واحدًا لكنه يوضح اتجاه الحل."}</p>
        <button type="button" onClick={useVerseHint} disabled={paused || complete || hintVisible} className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 px-4 py-2 text-xs font-black text-brand-gold disabled:opacity-40">🔎 {isEnglish ? "Hint" : "تلميح"}</button>
      </div></div>
      {isEnglish && <p className="mx-4 mt-3 text-xs text-brand-cream/45 sm:mx-6">Quran text is kept in its verified original Arabic wording.</p>}
      <div className="mx-4 mt-4 rounded-[2rem] border border-violet-200/10 bg-black/20 p-5 sm:mx-6">
        <div className="min-h-28 rounded-[1.5rem] border border-violet-200/15 bg-violet-200/[0.04] p-5 text-center text-xl leading-[2.5] text-brand-gold">{answer.length ? answer.map(index => tokens.find(token => token.index === index)?.text ?? "").join(" ") : <span className="text-sm text-brand-cream/30">{isEnglish ? "Start with the first word" : "ابدأ من الكلمة الأولى"}</span>}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {tokens.map(token => {
            const hinted = hintVisible && token.index === answer.length;
            return <button key={token.id} type="button" onClick={() => choose(token.index)} disabled={paused || answer.includes(token.index) || complete} className={"min-h-16 rounded-2xl border p-4 text-right text-base font-semibold transition " + (answer.includes(token.index) ? "border-brand-emerald/20 bg-brand-emerald/5 text-brand-cream/20" : hinted ? "border-brand-gold/80 bg-brand-gold/10 text-brand-gold ring-2 ring-brand-gold/20 animate-pulse" : "border-white/10 bg-white/[0.03] text-brand-cream hover:-translate-y-0.5 hover:border-violet-200/50")}>{hinted ? "✨ " + token.text : token.text}</button>;
          })}
        </div>
      </div>
      <GameToast tone={complete && levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

export function ZikrQuizGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: LearningGameProps) {
  const { isEnglish } = useLanguage();
  const isEnglishRef = useRef(isEnglish);
  useEffect(() => { isEnglishRef.current = isEnglish; }, [isEnglish]);
  const allQuestions = getVerifiedKidsQuizQuestions();
  const [levelIndex, setLevelIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [feedback, setFeedback] = useState(isEnglish ? "Read the question and choose an answer." : "اقرأ السؤال ثم اختر الإجابة.");
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const advancingRef = useRef(false);
  const runTotalsRef = useRef(createGameRunTotals());
  const levelResetPendingRef = useRef(false);

  useEffect(() => {
    runTotalsRef.current = createGameRunTotals();
    setLevelIndex(0);
  }, [difficulty, restartToken]);
  const meta = getKidsLevelMeta("zikr-quiz", difficulty, levelIndex);
  const count = Math.max(4, Math.min(allQuestions.length, (difficulty === "hard" ? 10 : difficulty === "normal" ? 7 : 5) + (levelIndex % 2)));
  const questions = useMemo(() => {
    return seededShuffle(allQuestions, "quiz:" + meta.seed).slice(0, count);
  }, [allQuestions, count, meta.seed]);

  useEffect(() => {
    setIndex(0);
    setCorrect(0);
    setStreak(0);
    setSelected(null);
    setSeconds(0);
    setFeedback(isEnglishRef.current ? meta.subtitleEn : meta.subtitleAr);
    setHiddenOptions([]);
    levelResetPendingRef.current = true;
    advancingRef.current = false;
  }, [difficulty, levelIndex, meta.subtitleAr, meta.subtitleEn, restartToken]);

  useEffect(() => { setFeedback(isEnglish ? "Read the question and choose an answer." : "اقرأ السؤال ثم اختر الإجابة."); }, [isEnglish]);

  useEffect(() => {
    if (paused || selected !== null || index >= questions.length) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [index, paused, questions.length, selected]);

  const question = questions[index];
  const complete = questions.length > 0 && index >= questions.length;
  const score = correct * 280 + streak * 60 + Math.max(0, correct * 5 - Math.floor(seconds / 20));

  useEffect(() => {
    const levelHud = learningHud(score, correct, streak, levelIndex, complete && levelIndex === KIDS_LEVEL_COUNT - 1);
    onHud(levelHud);
    if (levelResetPendingRef.current) {
      levelResetPendingRef.current = false;
      return;
    }
    if (!complete || advancingRef.current) return;
    advancingRef.current = true;
    const levelTotals = { score: levelHud.score, collectibles: levelHud.collectibles, combo: levelHud.combo };
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      runTotalsRef.current = accumulateGameLevel(runTotalsRef.current, levelTotals);
      onSound("success");
      setFeedback(isEnglishRef.current ? "Level " + (levelIndex + 1) + "/" + KIDS_LEVEL_COUNT + " complete. More questions are ahead..." : "أكملت المستوى " + (levelIndex + 1) + ". أسئلة مختلفة في الطريق...");
      window.setTimeout(() => setLevelIndex(value => value + 1), 700);
    } else {
      const totals = accumulateGameLevel(runTotalsRef.current, levelTotals);
      runTotalsRef.current = totals;
      const finalHud = learningHud(totals.score, totals.collectibles, totals.bestCombo, levelIndex, true);
      onHud(finalHud);
      onSound("success");
      setFeedback(isEnglishRef.current ? "You completed every ZIKR Quiz level." : "أكملت جميع مستويات اختبار ذِكر.");
      onResult(finalHud);
    }
  }, [complete, correct, levelIndex, onHud, onResult, onSound, score, streak]);

  const useFiftyFifty = () => {
    if (paused || selected !== null || !question || hiddenOptions.length > 0) return;
    const wrong = question.options
      .map((_, optionIndex) => optionIndex)
      .filter(optionIndex => optionIndex !== question.correctAnswer);
    const hideCount = Math.max(0, Math.min(2, wrong.length - 1));
    const start = wrong.length ? (meta.seed + index) % wrong.length : 0;
    const hidden = Array.from({ length: hideCount }, (_, offset) => wrong[(start + offset) % wrong.length]);
    setHiddenOptions(hidden);
    setFeedback(isEnglish ? (hideCount > 0 ? "Some incorrect answers were hidden. Two possible answers remain." : "There are not enough incorrect answers to use 50/50.") : (hideCount > 0 ? "تم حذف عدد محدود من الإجابات الخاطئة. بقيت إجابتان محتملتان." : "لا توجد إجابات خاطئة كافية لتطبيق 50/50."));
    onSound("move");
  };

  const choose = (answer: number) => {
    if (paused || selected !== null || !question) return;
    const ok = answer === question.correctAnswer;
    setSelected(answer);
    if (ok) {
      setCorrect(value => value + 1);
      setStreak(value => value + 1);
      onSound("success");
      setFeedback(isEnglish ? "Correct answer. Keep your streak going!" : "إجابة صحيحة. حافظ على السلسلة!");
    } else {
      setStreak(0);
      onSound("miss");
      setFeedback(isEnglish ? "That is not correct. Review the answer and continue." : "ليست الإجابة الصحيحة. راجعها ثم تابع.");
    }
    window.setTimeout(() => {
      setSelected(null);
      setHiddenOptions([]);
      setIndex(value => value + 1);
    }, 600);
  };

  if (!question) {
    return (
      <KidsGameStage theme="library" ariaLabel={isEnglish ? "ZIKR Quiz" : "اختبار ذِكر"}><KidsGameWorld gameId="zikr-quiz" />
        <KidsGameHeader eyebrow="ZIKR QUIZ" title={isEnglish ? "ZIKR Quiz" : "اختبار ذِكر"} description={isEnglish ? "You have finished the current set of verified Arabic questions." : meta.subtitleAr} />
        <div className="mx-4 rounded-[2rem] border border-brand-gold/20 bg-black/20 p-8 text-center sm:mx-6">
          <KidCharacter variant="reader" state={levelIndex === KIDS_LEVEL_COUNT - 1 ? "celebrate" : "think"} size={92} />
          <h4 className="mt-3 text-3xl font-black text-brand-cream">{isEnglish ? (levelIndex === KIDS_LEVEL_COUNT - 1 ? "Journey complete" : "Level complete") : (levelIndex === KIDS_LEVEL_COUNT - 1 ? "أنهيت الرحلة" : "اكتمل المستوى")}</h4>
          <p className="mt-2 text-brand-cream/60">{isEnglish ? "Correct answers: " + correct + " of " + questions.length + "." : "أجبت بشكل صحيح عن " + correct + " من " + questions.length + "."}</p>
        </div>
        <GameToast tone={levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
      </KidsGameStage>
    );
  }

  return (
    <KidsGameStage theme="library" ariaLabel={isEnglish ? "ZIKR Quiz" : "اختبار ذِكر"}>
      <KidsGameWorld gameId="zikr-quiz" />
      <KidsGameHeader eyebrow="ZIKR QUIZ" title={isEnglish ? "ZIKR Quiz" : "اختبار ذِكر"} description={isEnglish ? "Verified Arabic questions • " + meta.subtitleEn : question.category + " • " + meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={(index / questions.length) * 100} label={levelLabel(levelIndex, isEnglish)} /></div>} />
      <div className="px-4 sm:px-6">{isEnglish && <p className="mb-3 text-xs text-brand-cream/45">Question text and answer choices remain in their verified original Arabic wording.</p>}<KidsGameHud items={[
        { label: isEnglish ? "Score" : "النقاط", value: score, tone: "text-brand-gold" },
        { label: isEnglish ? "Correct" : "الصحيح", value: correct, tone: "text-brand-emerald" },
        { label: isEnglish ? "Streak" : "السلسلة", value: streak, tone: "text-violet-200" },
        { label: isEnglish ? "Time" : "الوقت", value: formatSeconds(seconds), tone: "text-sky-200" },
        { label: isEnglish ? "Level" : "المستوى", value: levelIndex + 1, tone: "text-amber-200" },
      ]} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-brand-cream/45">{isEnglish ? "50/50 is available once per question and narrows the choices to two." : "ميزة 50/50 متاحة مرة واحدة لكل سؤال، وتفتح لك آخر خيارين محتملين."}</p>
        <button type="button" onClick={useFiftyFifty} disabled={paused || selected !== null || hiddenOptions.length > 0} className="rounded-xl border border-brand-gold/30 bg-brand-gold/5 px-4 py-2 text-xs font-black text-brand-gold disabled:opacity-40">✂️ 50/50</button>
      </div></div>
      <div className="mx-4 mt-4 rounded-[2rem] border border-white/10 bg-black/20 p-5 sm:mx-6 sm:p-7">
        <div className="rounded-[1.7rem] border border-brand-gold/15 bg-brand-gold/[0.04] p-5"><p className="text-xs font-black tracking-[0.18em] text-brand-emerald/80">{isEnglish ? "QUESTION " + (index + 1) : "السؤال " + (index + 1)}</p><h4 className="mt-3 text-2xl font-black leading-10 text-brand-cream">{question.text}</h4></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.correctAnswer;
            const isSelected = optionIndex === selected;
            const hidden = hiddenOptions.includes(optionIndex);
            return <button key={option + ":" + optionIndex} type="button" onClick={() => choose(optionIndex)} disabled={selected !== null || hidden} className={[
              "min-h-24 rounded-2xl border p-4 text-right transition " + (hidden ? "opacity-20 blur-[1px]" : ""),
              isSelected ? (isCorrect ? "border-brand-emerald bg-brand-emerald/15 text-brand-emerald" : "border-rose-300/35 bg-rose-300/10 text-rose-100")
                : selected !== null && isCorrect ? "border-brand-emerald/60 bg-brand-emerald/10 text-brand-emerald"
                : "border-white/10 bg-white/[0.03] text-brand-cream hover:-translate-y-0.5 hover:border-brand-gold/45",
            ].join(" ")}><span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs text-brand-cream/60">{String.fromCharCode(65 + optionIndex)}</span><p className="leading-7">{option}</p></button>;
          })}
        </div>
      </div>
      <GameToast tone={selected === question.correctAnswer ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

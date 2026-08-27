"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameDifficulty, GameId, GameResultPayload } from "@/lib/games/registry";
import { getVerifiedKidsQuizQuestions, getVerifiedWuduSteps, type VerifiedQuizQuestion } from "@/lib/games/verified-content";
import { ArcadeGame } from "@/components/kids/games/arcade-game";
import type { ArcadeGameScene, ArcadeHud } from "@/lib/games/arcade/arcade-scene";
import { ZikrRunnerGame } from "@/components/kids/games/zikr-runner-game";
import type { RunnerHud, ZikrRunnerScene } from "@/lib/games/zikr-runner/runner-scene";

export type WorldHud = {
  score: number;
  collectibles: number;
  distance: number;
  combo: number;
  level: number;
  completed: boolean;
};

type WorldGameStageProps = {
  gameId: GameId;
  difficulty: GameDifficulty;
  muted: boolean;
  paused: boolean;
  restartToken: number;
  onPausedChange: (paused: boolean) => void;
  onReady: (controller: StageController | null) => void;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onError: (message: string) => void;
};

export type StageController = {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  toggleMute: () => boolean;
  isPaused: () => boolean;
};

function runnerHud(hud: RunnerHud): WorldHud {
  return { ...hud, combo: 0, level: Math.max(1, Math.floor(hud.speed / 80)), completed: false };
}

function arcadeHud(hud: ArcadeHud): WorldHud {
  return {
    score: hud.score,
    collectibles: hud.collectibles,
    distance: hud.distance,
    combo: hud.combo,
    level: hud.level,
    completed: hud.completed,
  };
}

export function WorldGameStage(props: WorldGameStageProps) {
  const { gameId, difficulty, muted, paused, restartToken, onPausedChange, onReady, onHud, onResult, onError } = props;
  const [runnerScene, setRunnerScene] = useState<ZikrRunnerScene | null>(null);
  const [arcadeScene, setArcadeScene] = useState<ArcadeGameScene | null>(null);
  const isRunner = gameId === "zikr-runner";
  const isArcade = gameId === "mosque-adventure" || gameId === "zikr-road" || gameId === "zikr-jump" || gameId === "hilal-fly";

  useEffect(() => {
    setRunnerScene(null);
    setArcadeScene(null);
    onReady(null);
  }, [gameId, onReady]);

  useEffect(() => {
    const controller = runnerScene
      ? {
          pause: () => runnerScene.pauseGame(),
          resume: () => runnerScene.resumeGame(),
          restart: () => runnerScene.restartGame(),
          toggleMute: () => runnerScene.toggleMute(),
          isPaused: () => runnerScene.scene.isPaused(),
        }
      : arcadeScene
        ? {
            pause: () => arcadeScene.pauseGame(),
            resume: () => arcadeScene.resumeGame(),
            restart: () => arcadeScene.restartGame(),
            toggleMute: () => arcadeScene.toggleMute(),
            isPaused: () => arcadeScene.scene.isPaused(),
          }
        : !isRunner && !isArcade
        ? { pause: () => undefined, resume: () => undefined, restart: () => undefined, toggleMute: () => false, isPaused: () => false }
        : null;
    onReady(controller);
  }, [arcadeScene, isArcade, isRunner, onReady, runnerScene]);

  useEffect(() => {
    if (paused) runnerScene?.pauseGame();
    else runnerScene?.resumeGame();
    if (paused) arcadeScene?.pauseGame();
    else arcadeScene?.resumeGame();
  }, [arcadeScene, paused, runnerScene]);

  useEffect(() => {
    if (restartToken === 0) return;
    runnerScene?.restartGame();
    arcadeScene?.restartGame();
  }, [arcadeScene, restartToken, runnerScene]);

  if (isRunner) {
    return (
      <ZikrRunnerGame
        muted={muted}
        onReady={scene => { setRunnerScene(scene); onPausedChange(false); }}
        onHud={hud => onHud(runnerHud(hud))}
        onGameOver={hud => onResult(runnerHud(hud))}
        onError={onError}
      />
    );
  }

  if (isArcade) {
    return (
      <ArcadeGame
        gameId={gameId}
        muted={muted}
        onReady={scene => { setArcadeScene(scene); onPausedChange(false); }}
        onHud={hud => onHud(arcadeHud(hud))}
        onGameOver={hud => onResult(arcadeHud(hud))}
        onError={onError}
      />
    );
  }

  const localProps = { difficulty, restartToken, paused, onHud, onResult };
  if (gameId === "zikr-memory") return <MemoryGame {...localProps} />;
  if (gameId === "wudu-challenge") return <OrderingGame {...localProps} />;
  if (gameId === "verse-puzzle") return <VersePuzzleGame {...localProps} />;
  if (gameId === "zikr-quiz") return <QuizGame {...localProps} />;
  if (gameId === "good-deeds") return <GoodDeedsGame {...localProps} />;
  if (gameId === "mosque-cleanup") return <CleanupGame {...localProps} />;
  return <ColoringGame {...localProps} />;
}

type LocalGameProps = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
};

const SYMBOLS = ["✦", "☾", "◇", "⌂", "◌", "○"];

function MemoryGame({ difficulty, restartToken, paused, onHud, onResult }: LocalGameProps) {
  const pairCount = difficulty === "hard" ? 6 : difficulty === "normal" ? 5 : 4;
  const [cards, setCards] = useState(() => createMemoryCards(pairCount));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    setCards(createMemoryCards(pairCount));
    setFlipped([]); setMatched([]); setMoves(0); setCombo(0); setStartedAt(Date.now());
  }, [pairCount, restartToken]);

  useEffect(() => {
    if (paused || flipped.length !== 2) return;
    const [first, second] = flipped;
    const isMatch = cards[first]?.symbol === cards[second]?.symbol;
    const timer = window.setTimeout(() => {
      setMoves(value => value + 1);
      if (isMatch) {
        setMatched(value => [...value, first, second]);
        setCombo(value => value + 1);
      } else {
        setCombo(0);
      }
      setFlipped([]);
    }, isMatch ? 180 : 700);
    return () => window.clearTimeout(timer);
  }, [cards, flipped, paused]);

  useEffect(() => {
    const score = Math.max(0, matched.length * 120 + combo * 25 - moves * 8);
    const hud = { score, collectibles: matched.length / 2, distance: 0, combo, level: 1, completed: matched.length === cards.length };
    onHud(hud);
    if (hud.completed) onResult({ ...hud, score: score + Math.max(0, 600 - Math.floor((Date.now() - startedAt) / 1000) * 5) });
  }, [cards.length, combo, matched.length, moves, onHud, onResult, startedAt]);

  const flip = (index: number) => {
    if (paused || flipped.length >= 2 || matched.includes(index) || flipped.includes(index)) return;
    setFlipped(value => [...value, index]);
  };
  return <div className="grid grid-cols-4 gap-3 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5" aria-label="بطاقات ذاكرة ذِكر">
    {cards.map((card, index) => {
      const visible = flipped.includes(index) || matched.includes(index);
      return <button key={card.id} type="button" onClick={() => flip(index)} aria-label={visible ? `بطاقة ${card.symbol}` : "بطاقة مخفية"} className={`aspect-square rounded-xl border text-3xl transition ${visible ? "border-brand-gold bg-brand-gold/20 text-brand-gold" : "border-brand-emerald/30 bg-brand-emerald/10 text-brand-cream/50 hover:border-brand-gold"}`}>{visible ? card.symbol : "?"}</button>;
    })}
  </div>;
}

function createMemoryCards(pairCount: number) {
  return [...SYMBOLS.slice(0, pairCount), ...SYMBOLS.slice(0, pairCount)]
    .sort(() => Math.random() - 0.5)
    .map((symbol, index) => ({ id: `${symbol}-${index}`, symbol }));
}

function OrderingGame({ difficulty, restartToken, paused, onHud, onResult }: LocalGameProps) {
  const source = useMemo(() => getVerifiedWuduSteps(), []);
  const steps = difficulty === "easy" ? source.slice(0, 6) : source;
  const [order, setOrder] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("");
  useEffect(() => { setOrder([]); setMistakes(0); setFeedback(""); }, [restartToken, steps.length]);
  const next = order.length + 1;
  const choose = (step: number) => {
    if (paused || order.includes(step) || steps.length === 0) return;
    if (step !== next) { setMistakes(value => value + 1); setFeedback("حاول مرة أخرى، راجع ترتيب الخطوات المعتمد."); return; }
    setOrder(value => [...value, step]); setFeedback("إجابة صحيحة");
  };
  const completed = steps.length > 0 && order.length === steps.length;
  const hud = { score: Math.max(0, order.length * 220 - mistakes * 30), collectibles: order.length, distance: 0, combo: Math.max(0, order.length - mistakes), level: difficulty === "easy" ? 1 : 2, completed };
  useEffect(() => { onHud(hud); if (completed) onResult(hud); }, [completed, mistakes, onHud, onResult, order.length, hud.score, hud.combo, hud.level]);
  if (steps.length === 0) return <Unavailable text="لا تتوفر خطوات الوضوء المعتمدة حاليًا." />;
  return <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5"><p className="text-sm text-brand-cream/70">اختر الخطوة التالية بالترتيب الصحيح.</p><div className="grid gap-3">{steps.map(step => <button key={step.order} type="button" onClick={() => choose(step.order)} disabled={order.includes(step.order)} className={`rounded-xl border p-4 text-right transition ${order.includes(step.order) ? "border-brand-emerald/40 bg-brand-emerald/10 opacity-60" : "border-brand-cream/15 bg-black/20 hover:border-brand-gold"}`}><span className="ml-2 text-brand-gold">{step.order}</span>{step.text}</button>)}</div>{feedback && <p className="text-sm text-brand-emerald" role="status">{feedback}</p>}</div>;
}

function VersePuzzleGame({ difficulty, restartToken, paused, onHud, onResult }: LocalGameProps) {
  const [words, setWords] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setAnswer([]);
    fetch(`/api/kids/games/verse?difficulty=${difficulty}`, { credentials: "include" })
      .then(response => response.ok ? response.json() as Promise<{ words?: string[] }> : Promise.reject(new Error("unavailable")))
      .then(data => { if (active) { setWords(Array.isArray(data.words) ? data.words : []); setAvailable(Array.isArray(data.words) && data.words.length > 0); } })
      .catch(() => { if (active) setAvailable(false); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [difficulty, restartToken]);
  const completed = words.length > 0 && answer.length === words.length && answer.every((word, index) => word === words[index]);
  const choose = (word: string, index: number) => { if (paused || answer.includes(`${index}:${word}`)) return; setAnswer(value => [...value, word]); };
  const score = Math.max(0, answer.length * 180 - Math.max(0, answer.length - 1) * 12);
  const hud = { score, collectibles: answer.length, distance: 0, combo: answer.length, level: difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1, completed };
  useEffect(() => { onHud(hud); if (completed) onResult(hud); }, [answer.length, completed, onHud, onResult, score, hud.combo, hud.level]);
  if (loading) return <div className="grid min-h-[280px] place-items-center rounded-2xl border border-brand-gold/30 bg-[#071b24] text-brand-cream/70" role="status">جاري تجهيز نص موثق...</div>;
  if (!available) return <Unavailable text="لغز الآية يحتاج إلى نص قرآني موثق متاح من قاعدة المعرفة." />;
  return <div className="space-y-5 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5"><p className="text-sm text-brand-cream/70">اضغط الكلمات بالترتيب. النص مأخوذ كما هو من المصدر الموثق.</p><div className="min-h-16 rounded-xl border border-brand-emerald/30 bg-brand-emerald/5 p-4 text-center leading-10 text-brand-gold">{answer.join(" ")}</div><div className="flex flex-wrap justify-center gap-2">{words.map((word, index) => <button key={`${word}-${index}`} type="button" onClick={() => choose(word, index)} disabled={answer.length > index} className="rounded-lg border border-brand-cream/20 bg-black/20 px-3 py-2 text-brand-cream disabled:opacity-30">{word}</button>)}</div></div>;
}

function QuizGame({ difficulty, restartToken, paused, onHud, onResult }: LocalGameProps) {
  const questions = useMemo(() => getVerifiedKidsQuizQuestions().slice(0, difficulty === "hard" ? 10 : difficulty === "normal" ? 7 : 5), [difficulty]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  useEffect(() => { setIndex(0); setCorrect(0); setStreak(0); setAnswered(false); }, [restartToken, questions.length]);
  const question = questions[index];
  if (!question) return <Unavailable text="لا تتوفر أسئلة تعليمية موثقة حاليًا." />;
  const hud = { score: correct * 250 + streak * 50, collectibles: correct, distance: 0, combo: streak, level: difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1, completed: false };
  const choose = (answer: number) => {
    if (paused || answered) return;
    const isCorrect = answer === question.correctAnswer;
    setAnswered(true);
    setCorrect(value => value + (isCorrect ? 1 : 0));
    setStreak(value => isCorrect ? value + 1 : 0);
    window.setTimeout(() => {
      if (index + 1 >= questions.length) {
        onHud({ ...hud, score: (correct + (isCorrect ? 1 : 0)) * 250, collectibles: correct + (isCorrect ? 1 : 0), combo: isCorrect ? streak + 1 : 0, completed: true });
        onResult({ ...hud, score: (correct + (isCorrect ? 1 : 0)) * 250, collectibles: correct + (isCorrect ? 1 : 0), combo: isCorrect ? streak + 1 : 0, completed: true });
      } else { setIndex(value => value + 1); setAnswered(false); }
    }, 500);
  };
  return <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5"><p className="text-sm text-brand-cream/60">السؤال {index + 1} من {questions.length}</p><h3 className="text-xl font-bold text-brand-gold">{question.text}</h3><div className="grid gap-3">{question.options.map((option, optionIndex) => <button key={option} type="button" onClick={() => choose(optionIndex)} disabled={answered} className={`rounded-xl border p-4 text-right ${answered && optionIndex === question.correctAnswer ? "border-brand-emerald bg-brand-emerald/20" : "border-brand-cream/15 bg-black/20 hover:border-brand-gold"}`}>{option}</button>)}</div></div>;
}

function GoodDeedsGame({ restartToken, paused, onHud, onResult }: LocalGameProps) {
  const deeds = ["ساعد في ترتيب الألعاب", "شارك شيئًا تحبه مع أخيك", "قل شكرًا بلطف", "اسقِ نباتًا بإشراف الأسرة", "اسأل شخصًا يحتاج إلى مساعدة"]; 
  const [completed, setCompleted] = useState<number[]>([]);
  useEffect(() => setCompleted([]), [restartToken]);
  const choose = (index: number) => { if (!paused && !completed.includes(index)) setCompleted(value => [...value, index]); };
  const hud = { score: completed.length * 200, collectibles: completed.length, distance: 0, combo: completed.length, level: 1, completed: completed.length === deeds.length };
  useEffect(() => { onHud(hud); if (hud.completed) onResult(hud); }, [completed.length, onHud, onResult, hud.score, hud.combo, hud.completed]);
  return <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5"><p className="text-sm leading-relaxed text-brand-cream/70">اختر مهمة داخل اللعبة فقط. لا توجد خسارة، ولا يلزم تنفيذ أي نشاط في الواقع.</p><div className="grid gap-3">{deeds.map((deed, index) => <button key={deed} type="button" onClick={() => choose(index)} className={`rounded-xl border p-4 text-right ${completed.includes(index) ? "border-brand-emerald bg-brand-emerald/10" : "border-brand-cream/15 bg-black/20 hover:border-brand-gold"}`}>{completed.includes(index) ? "✓ " : ""}{deed}</button>)}</div></div>;
}

function CleanupGame({ restartToken, paused, onHud, onResult }: LocalGameProps) {
  const items = ["كتاب", "مصباح", "وسادة", "كرة", "نبتة", "علبة"];
  const [sorted, setSorted] = useState<string[]>([]);
  useEffect(() => setSorted([]), [restartToken]);
  const choose = (item: string) => { if (!paused && !sorted.includes(item)) setSorted(value => [...value, item]); };
  const hud = { score: sorted.length * 180, collectibles: sorted.length, distance: 0, combo: sorted.length, level: 1, completed: sorted.length === items.length };
  useEffect(() => { onHud(hud); if (hud.completed) onResult(hud); }, [onHud, onResult, sorted.length, hud.score, hud.combo, hud.completed]);
  return <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5"><p className="text-sm text-brand-cream/70">رتب البيئة الخيالية بالنقر على كل غرض.</p><div className="grid grid-cols-2 gap-3">{items.map(item => <button key={item} type="button" onClick={() => choose(item)} disabled={sorted.includes(item)} className="rounded-xl border border-brand-cream/15 bg-black/20 p-5 text-brand-cream hover:border-brand-gold disabled:border-brand-emerald/30 disabled:text-brand-emerald">{sorted.includes(item) ? "✓ " : ""}{item}</button>)}</div></div>;
}

function ColoringGame({ restartToken, onHud, onResult }: LocalGameProps) {
  const colors = ["#f3c969", "#5fd1a6", "#e28a5a", "#8ab6e2", "#d7a7e8"];
  const [selected, setSelected] = useState(colors[0]);
  const [cells, setCells] = useState<string[]>(() => loadDrawing());
  useEffect(() => { if (restartToken > 0) setCells([]); }, [restartToken]);
  const paint = (index: number) => setCells(value => { const next = [...value]; next[index] = selected; localStorage.setItem("zikr-kids-coloring-v1", JSON.stringify(next)); return next; });
  const clear = () => { setCells([]); localStorage.removeItem("zikr-kids-coloring-v1"); };
  const filled = cells.filter(Boolean).length;
  const hud = { score: filled * 100, collectibles: filled, distance: 0, combo: filled, level: 1, completed: filled === 12 };
  useEffect(() => { onHud(hud); if (hud.completed) onResult(hud); }, [filled, onHud, onResult, hud.score, hud.combo, hud.completed]);
  return <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5"><p className="text-sm text-brand-cream/70">تلوين محلي على هذا الجهاز؛ لا يحتاج إلى حساب.</p><div className="flex flex-wrap gap-2" aria-label="الألوان">{colors.map(color => <button key={color} type="button" onClick={() => setSelected(color)} aria-label={`اختيار اللون ${color}`} aria-pressed={selected === color} className="h-10 w-10 rounded-full border-2 border-brand-cream/50" style={{ backgroundColor: color }} />)}</div><div className="grid grid-cols-4 gap-2 rounded-xl border border-brand-emerald/20 p-4">{Array.from({ length: 12 }, (_, index) => <button key={index} type="button" onClick={() => paint(index)} aria-label={`منطقة تلوين ${index + 1}`} className="aspect-square rounded-lg border border-brand-cream/20" style={{ backgroundColor: cells[index] || "#14313a" }} />)}</div><button type="button" onClick={clear} className="rounded-lg border border-brand-cream/20 px-4 py-2 text-sm text-brand-cream">مسح الرسم</button></div>;
}

function loadDrawing() {
  if (typeof window === "undefined") return [];
  try { const value = JSON.parse(localStorage.getItem("zikr-kids-coloring-v1") || "[]"); return Array.isArray(value) ? value.filter(item => typeof item === "string").slice(0, 12) : []; } catch { return []; }
}

function Unavailable({ text }: { text: string }) { return <div className="grid min-h-[280px] place-items-center rounded-2xl border border-brand-gold/30 bg-[#071b24] p-6 text-center text-brand-cream/70" role="status">{text}</div>; }

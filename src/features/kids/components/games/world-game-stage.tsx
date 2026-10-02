"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GameDifficulty,
  GameId,
} from "@/lib/games/registry";
import {
  getVerifiedKidsQuizQuestions,
} from "@/lib/games/verified-content";
import { ArcadeGame } from "@/features/kids/components/games/arcade-game";
import type {
  ArcadeGameScene,
  ArcadeHud,
} from "@/lib/games/arcade/arcade-scene";
import { ZikrRunnerGame } from "@/features/kids/components/games/zikr-runner-game";
import type {
  RunnerHud,
  ZikrRunnerScene,
} from "@/lib/games/zikr-runner/runner-scene";
import { ToneFeedback, type GameSoundEvent } from "@/lib/games/tone-feedback";
import { ZikrMemoryGame } from "@/features/kids/components/games/zikr-memory-game";
import { WuduChallengeGame } from "@/features/kids/components/games/wudu-challenge-game";
import { VersePuzzleGame } from "@/features/kids/components/games/verse-puzzle-game";
import { MosqueAdventureGame } from "@/features/kids/components/games/mosque-adventure-game";
import { ZikrRoadGame } from "@/features/kids/components/games/zikr-road-game";
import { ZikrJumpGame } from "@/features/kids/components/games/zikr-jump-game";

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
  setMuted: (value: boolean) => void;
  isPaused: () => boolean;
};

function runnerHud(hud: RunnerHud): WorldHud {
  return {
    ...hud,
    combo: 0,
    level: Math.max(1, Math.floor(hud.speed / 80)),
    completed: false,
  };
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
  const {
    gameId,
    difficulty,
    muted,
    paused,
    restartToken,
    onPausedChange,
    onReady,
    onHud,
    onResult,
    onError,
  } = props;
  const [runnerScene, setRunnerScene] = useState<ZikrRunnerScene | null>(null);
  const [arcadeScene, setArcadeScene] = useState<ArcadeGameScene | null>(null);
  const localTone = useRef<ToneFeedback | null>(null);

  useEffect(() => {
    const theme = gameId === "zikr-memory" || gameId === "verse-puzzle" ? "night" : gameId === "wudu-challenge" || gameId === "zikr-quiz" ? "learning" : "adventure";
    localTone.current = new ToneFeedback(theme);
    return () => {
      localTone.current?.dispose();
      localTone.current = null;
    };
  }, [gameId]);

  useEffect(() => {
    localTone.current?.setMuted(muted);
  }, [muted]);

  const playLocalSound = useCallback((event: GameSoundEvent) => {
    localTone.current?.playEvent(event);
  }, []);
  const isRunner = gameId === "zikr-runner";
  const isArcade = gameId === "hilal-fly";

  useEffect(() => {
    setRunnerScene(null);
    setArcadeScene(null);
    onReady(null);
  }, [gameId, onReady]);

  const handleRunnerReady = useCallback(
    (scene: ZikrRunnerScene) => {
      setRunnerScene(scene);
      onPausedChange(false);
    },
    [onPausedChange]
  );
  const handleArcadeReady = useCallback(
    (scene: ArcadeGameScene) => {
      setArcadeScene(scene);
      onPausedChange(false);
    },
    [onPausedChange]
  );

  useEffect(() => {
    const controller = runnerScene
      ? {
          pause: () => runnerScene.pauseGame(),
          resume: () => runnerScene.resumeGame(),
          restart: () => runnerScene.restartGame(),
          toggleMute: () => runnerScene.toggleMute(),
          setMuted: (value: boolean) => runnerScene.setMuted(value),
          isPaused: () => runnerScene.scene.isPaused(),
        }
      : arcadeScene
        ? {
            pause: () => arcadeScene.pauseGame(),
            resume: () => arcadeScene.resumeGame(),
            restart: () => arcadeScene.restartGame(),
            toggleMute: () => arcadeScene.toggleMute(),
            setMuted: (value: boolean) => arcadeScene.setMuted(value),
            isPaused: () => arcadeScene.scene.isPaused(),
          }
        : !isRunner && !isArcade
          ? {
              pause: () => undefined,
              resume: () => undefined,
              restart: () => undefined,
              toggleMute: () => false,
              setMuted: () => undefined,
              isPaused: () => false,
            }
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
        onReady={handleRunnerReady}
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
        onReady={handleArcadeReady}
        onHud={hud => onHud(arcadeHud(hud))}
        onGameOver={hud => onResult(arcadeHud(hud))}
        onError={onError}
      />
    );
  }

  const localProps = {
    difficulty,
    restartToken,
    paused,
    onHud,
    onResult,
    onSound: playLocalSound,
  };
  if (gameId === "zikr-memory") return <ZikrMemoryGame {...localProps} />;
  if (gameId === "wudu-challenge") return <WuduChallengeGame {...localProps} />;
  if (gameId === "verse-puzzle") return <VersePuzzleGame {...localProps} />;
  if (gameId === "mosque-adventure") return <MosqueAdventureGame {...localProps} />;
  if (gameId === "zikr-road") return <ZikrRoadGame {...localProps} />;
  if (gameId === "zikr-jump") return <ZikrJumpGame {...localProps} />;
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
  onSound: (event: GameSoundEvent) => void;
};

function QuizGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LocalGameProps) {
  const questions = useMemo(
    () =>
      getVerifiedKidsQuizQuestions().slice(
        0,
        difficulty === "hard" ? 10 : difficulty === "normal" ? 7 : 5
      ),
    [difficulty]
  );
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  useEffect(() => {
    setIndex(0);
    setCorrect(0);
    setStreak(0);
    setAnswered(false);
  }, [restartToken, questions.length]);
  const question = questions[index];
  if (!question)
    return <Unavailable text="لا تتوفر أسئلة تعليمية موثقة حاليًا." />;
  const hud = {
    score: correct * 250 + streak * 50,
    collectibles: correct,
    distance: 0,
    combo: streak,
    level: difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1,
    completed: false,
  };
  const choose = (answer: number) => {
    if (paused || answered) return;
    const isCorrect = answer === question.correctAnswer;
    onSound(isCorrect ? "success" : "miss");
    setAnswered(true);
    setCorrect(value => value + (isCorrect ? 1 : 0));
    setStreak(value => (isCorrect ? value + 1 : 0));
    window.setTimeout(() => {
      if (index + 1 >= questions.length) {
        onHud({
          ...hud,
          score: (correct + (isCorrect ? 1 : 0)) * 250,
          collectibles: correct + (isCorrect ? 1 : 0),
          combo: isCorrect ? streak + 1 : 0,
          completed: true,
        });
        onResult({
          ...hud,
          score: (correct + (isCorrect ? 1 : 0)) * 250,
          collectibles: correct + (isCorrect ? 1 : 0),
          combo: isCorrect ? streak + 1 : 0,
          completed: true,
        });
      } else {
        setIndex(value => value + 1);
        setAnswered(false);
      }
    }, 500);
  };
  return (
    <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5">
      <p className="text-sm text-brand-cream/60">
        السؤال {index + 1} من {questions.length}
      </p>
      <h3 className="text-xl font-bold text-brand-gold">{question.text}</h3>
      <div className="grid gap-3">
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            onClick={() => choose(optionIndex)}
            disabled={answered}
            className={`rounded-xl border p-4 text-right ${answered && optionIndex === question.correctAnswer ? "border-brand-emerald bg-brand-emerald/20" : "border-brand-cream/15 bg-black/20 hover:border-brand-gold"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function GoodDeedsGame({
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LocalGameProps) {
  const deeds = [
    "ساعد في ترتيب الألعاب",
    "شارك شيئًا تحبه مع أخيك",
    "قل شكرًا بلطف",
    "اسقِ نباتًا بإشراف الأسرة",
    "اسأل شخصًا يحتاج إلى مساعدة",
  ];
  const [completed, setCompleted] = useState<number[]>([]);
  useEffect(() => setCompleted([]), [restartToken]);
  const choose = (index: number) => {
    if (paused || completed.includes(index)) return;
    onSound("collect");
    setCompleted(value => [...value, index]);
  };
  const hud = useMemo(() => ({
    score: completed.length * 200,
    collectibles: completed.length,
    distance: 0,
    combo: completed.length,
    level: 1,
    completed: completed.length === deeds.length,
  }), [completed.length, deeds.length]);
  useEffect(() => {
    onHud(hud);
    if (hud.completed) {
      onSound("success");
      onResult(hud);
    }
  }, [
    completed.length,
    onHud,
    onResult,
    onSound,
    hud,
  ]);
  return (
    <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5">
      <p className="text-sm leading-relaxed text-brand-cream/70">
        اختر مهمة داخل اللعبة فقط. لا توجد خسارة، ولا يلزم تنفيذ أي نشاط في
        الواقع.
      </p>
      <div className="grid gap-3">
        {deeds.map((deed, index) => (
          <button
            key={deed}
            type="button"
            onClick={() => choose(index)}
            className={`rounded-xl border p-4 text-right ${completed.includes(index) ? "border-brand-emerald bg-brand-emerald/10" : "border-brand-cream/15 bg-black/20 hover:border-brand-gold"}`}
          >
            {completed.includes(index) ? "✓ " : ""}
            {deed}
          </button>
        ))}
      </div>
    </div>
  );
}

function CleanupGame({
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: LocalGameProps) {
  const items = ["كتاب", "مصباح", "وسادة", "كرة", "نبتة", "علبة"];
  const [sorted, setSorted] = useState<string[]>([]);
  useEffect(() => setSorted([]), [restartToken]);
  const choose = (item: string) => {
    if (paused || sorted.includes(item)) return;
    onSound("collect");
    setSorted(value => [...value, item]);
  };
  const hud = useMemo(() => ({
    score: sorted.length * 180,
    collectibles: sorted.length,
    distance: 0,
    combo: sorted.length,
    level: 1,
    completed: sorted.length === items.length,
  }), [items.length, sorted.length]);
  useEffect(() => {
    onHud(hud);
    if (hud.completed) {
      onSound("success");
      onResult(hud);
    }
  }, [
    onHud,
    onResult,
    onSound,
    hud,
  ]);
  return (
    <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5">
      <p className="text-sm text-brand-cream/70">
        رتب البيئة الخيالية بالنقر على كل غرض.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => choose(item)}
            disabled={sorted.includes(item)}
            className="rounded-xl border border-brand-cream/15 bg-black/20 p-5 text-brand-cream hover:border-brand-gold disabled:border-brand-emerald/30 disabled:text-brand-emerald"
          >
            {sorted.includes(item) ? "✓ " : ""}
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColoringGame({
  restartToken,
  onHud,
  onResult,
  onSound,
}: LocalGameProps) {
  const colors = ["#f3c969", "#5fd1a6", "#e28a5a", "#8ab6e2", "#d7a7e8"];
  const [selected, setSelected] = useState(colors[0]);
  const [cells, setCells] = useState<string[]>(() => loadDrawing());
  const [history, setHistory] = useState<string[][]>([]);
  useEffect(() => {
    if (restartToken > 0) {
      setCells([]);
      setHistory([]);
      localStorage.removeItem("zikr-kids-coloring-v1");
    }
  }, [restartToken]);
  const _paint = (index: number) =>
    setCells(value => {
      onSound("collect");
      setHistory(previous => [...previous.slice(-19), value]);
      const next = [...value];
      next[index] = selected;
      localStorage.setItem("zikr-kids-coloring-v1", JSON.stringify(next));
      return next;
    });
  const paintRegion = (index: number) => {
    _paint(index);
  };
  const undo = () =>
    setHistory(previous => {
      const last = previous.at(-1);
      if (!last) return previous;
      onSound("move");
      setCells(last);
      localStorage.setItem("zikr-kids-coloring-v1", JSON.stringify(last));
      return previous.slice(0, -1);
    });
  const clear = () => {
    onSound("miss");
    setHistory(previous => [...previous.slice(-19), cells]);
    setCells([]);
    localStorage.removeItem("zikr-kids-coloring-v1");
  };
  const filled = cells.filter(Boolean).length;
  const hud = useMemo(() => ({
    score: filled * 100,
    collectibles: filled,
    distance: 0,
    combo: filled,
    level: 1,
    completed: filled === 12,
  }), [filled]);
  useEffect(() => {
    onHud(hud);
    if (hud.completed) onResult(hud);
  }, [hud, onHud, onResult]);
  const regionFill = (index: number) => cells[index] || "#14313a";
  return (
    <div className="space-y-4 rounded-2xl border border-brand-gold/30 bg-[#071b24] p-5">
      <p className="text-sm text-brand-cream/70">
        لوحة مسجد وهلال أصلية، والتلوين محفوظ محليًا على هذا الجهاز دون حساب.
      </p>
      <div className="flex flex-wrap gap-2" aria-label="الألوان">
        {colors.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => setSelected(color)}
            aria-label={`اختيار اللون ${color}`}
            aria-pressed={selected === color}
            className="h-10 w-10 rounded-full border-2 border-brand-cream/50"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-brand-emerald/20 bg-[#0b2832] p-3">
        <svg
          viewBox="0 0 360 240"
          className="mx-auto h-auto w-full max-w-xl select-none touch-none"
          role="img"
          aria-label="رسم مسجد وهلال للتلوين"
        >
          <rect
            x="12"
            y="12"
            width="336"
            height="216"
            rx="24"
            fill="#102f3a"
            stroke="#39776f"
            strokeWidth="4"
          />
          <circle
            cx="280"
            cy="58"
            r="27"
            fill={regionFill(0)}
            stroke="#f3c969"
            strokeWidth="3"
            className="cursor-pointer"
            onClick={() => paintRegion(0)}
          />
          <circle cx="291" cy="48" r="27" fill="#102f3a" />
          <path
            d="M48 194h264M70 194v-62h220v62M92 132v-45h176v45M132 87l48-44 48 44Z"
            fill={regionFill(1)}
            stroke="#f3c969"
            strokeWidth="4"
            className="cursor-pointer"
            onClick={() => paintRegion(1)}
          />
          <path
            d="M163 194v-48h34v48Z"
            fill={regionFill(2)}
            stroke="#f3c969"
            strokeWidth="3"
            className="cursor-pointer"
            onClick={() => paintRegion(2)}
          />
          <path
            d="M75 132h25v62H75zM260 132h25v62h-25z"
            fill={regionFill(3)}
            stroke="#f3c969"
            strokeWidth="3"
            className="cursor-pointer"
            onClick={() => paintRegion(3)}
          />
          <path
            d="M177 43V25h6v18M171 25h18"
            fill="none"
            stroke="#f3c969"
            strokeWidth="3"
          />
          <circle
            cx="48"
            cy="54"
            r="10"
            fill={regionFill(4)}
            stroke="#5fd1a6"
            strokeWidth="3"
            className="cursor-pointer"
            onClick={() => paintRegion(4)}
          />
          <path
            d="M36 194c8-21 18-21 26 0M300 194c8-21 18-21 26 0"
            fill={regionFill(5)}
            stroke="#5fd1a6"
            strokeWidth="3"
            className="cursor-pointer"
            onClick={() => paintRegion(5)}
          />
          <path d="M30 212h300" stroke="#d7a7e8" strokeWidth="5" />
          <g fill={regionFill(6)} stroke="#8ab6e2" strokeWidth="2" className="cursor-pointer" onClick={() => paintRegion(6)}>
            <circle cx="92" cy="212" r="7" />
            <circle cx="122" cy="212" r="7" />
            <circle cx="238" cy="212" r="7" />
            <circle cx="268" cy="212" r="7" />
          </g>
          <g fill={regionFill(7)} stroke="#e28a5a" strokeWidth="2" className="cursor-pointer" onClick={() => paintRegion(7)}>
            <path d="M32 92l12-12 12 12-12 12z" />
            <path d="M304 108l12-12 12 12-12 12z" />
          </g>
          {Array.from({ length: 4 }, (_, index) => (
            <rect
              key={index}
              x={101 + index * 42}
              y="102"
              width="22"
              height="20"
              rx="4"
              fill={regionFill(8 + index)}
              stroke="#f3c969"
              strokeWidth="2"
              className="cursor-pointer"
              onClick={() => paintRegion(8 + index)}
            />
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={undo}
          disabled={history.length === 0}
          className="rounded-lg border border-brand-cream/20 px-4 py-2 text-sm text-brand-cream disabled:opacity-40"
        >
          تراجع
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-brand-cream/20 px-4 py-2 text-sm text-brand-cream"
        >
          مسح الرسم
        </button>
      </div>
    </div>
  );
}

function loadDrawing() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(
      localStorage.getItem("zikr-kids-coloring-v1") || "[]"
    );
    return Array.isArray(value)
      ? value.filter(item => typeof item === "string").slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

function Unavailable({ text }: { text: string }) {
  return (
    <div
      className="grid min-h-[280px] place-items-center rounded-2xl border border-brand-gold/30 bg-[#071b24] p-6 text-center text-brand-cream/70"
      role="status"
    >
      {text}
    </div>
  );
}

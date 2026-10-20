"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/layout/language-provider";
import type { GameDifficulty, GameId } from "@/lib/games/registry";
import { ToneFeedback, type GameSoundEvent } from "@/lib/games/tone-feedback";
import {
  ZikrRunnerGame,
  ZikrRoadGame,
} from "@/features/kids/components/games/kids-action-runner-road";
import {
  ZikrJumpGame,
  HilalFlyGame,
  MosqueAdventureGame,
} from "@/features/kids/components/games/kids-action-adventure";
import {
  ZikrMemoryGame,
  WuduChallengeGame,
  VersePuzzleGame,
  ZikrQuizGame,
} from "@/features/kids/components/games/kids-learning-games";
import { KidsLetterLabGame } from "@/features/kids/components/games/kids-letter-lab";
import {
  GoodDeedsGame,
  MosqueCleanupGame,
  ZikrColoringGame,
} from "@/features/kids/components/games/kids-values-coloring";

export type WorldHud = {
  score: number;
  collectibles: number;
  distance: number;
  combo: number;
  level: number;
  completed: boolean;
  timeSeconds?: number;
  mistakes?: number;
  accuracy?: number;
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

type RuntimeBoundaryProps = {
  children: ReactNode;
  isEnglish: boolean;
  onError: (message: string) => void;
  onRetry: () => void;
};

type RuntimeBoundaryState = { hasError: boolean };

class RuntimeErrorBoundary extends Component<RuntimeBoundaryProps, RuntimeBoundaryState> {
  state: RuntimeBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RuntimeBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error instanceof Error ? error.message : "Unknown game runtime error");
  }

  private retry = () => {
    this.setState({ hasError: false });
    this.props.onRetry();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="relative z-20 grid min-h-[360px] place-items-center p-6 text-center sm:min-h-[460px]">
        <div className="max-w-md rounded-2xl border border-brand-gold/25 bg-[#071b24]/90 p-6 shadow-2xl">
          <p className="text-3xl" aria-hidden="true">🌱</p>
          <h3 className="mt-3 text-xl font-black text-brand-gold">
            {this.props.isEnglish ? "This round needs a fresh start" : "تحتاج هذه الجولة إلى بداية جديدة"}
          </h3>
          <p className="mt-2 text-sm leading-7 text-brand-cream/70">
            {this.props.isEnglish ? "Your progress is safe. Restart the round and keep learning." : "تقدمك آمن. أعد تشغيل الجولة وواصل التعلم."}
          </p>
          <button type="button" onClick={this.retry} className="mt-5 min-h-11 rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-black">
            {this.props.isEnglish ? "Restart round" : "إعادة تشغيل الجولة"}
          </button>
        </div>
      </div>
    );
  }
}

export function WorldGameStage(props: WorldGameStageProps) {
  const { isEnglish } = useLanguage();
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

  const localTone = useRef<ToneFeedback | null>(null);
  const [recoveryKey, setRecoveryKey] = useState(0);

  useEffect(() => {
    const theme =
      gameId === "zikr-memory" || gameId === "verse-puzzle"
        ? "night"
        : gameId === "wudu-challenge" || gameId === "zikr-quiz"
          ? "learning"
          : "adventure";
    localTone.current = new ToneFeedback(theme);
    return () => {
      localTone.current?.dispose();
      localTone.current = null;
    };
  }, [gameId]);

  useEffect(() => {
    localTone.current?.setMuted(muted);
  }, [muted]);

  const playSound = useCallback(
    (event: GameSoundEvent) => {
      if (!muted) localTone.current?.playEvent(event);
    },
    [muted]
  );

  const noopController = useMemo<StageController>(
    () => ({
      pause: () => undefined,
      resume: () => undefined,
      restart: () => undefined,
      toggleMute: () => false,
      setMuted: () => undefined,
      isPaused: () => paused,
    }),
    [paused]
  );

  useEffect(() => {
    onReady(noopController);
  }, [noopController, onReady]);

  useEffect(() => {
    onError("");
  }, [gameId, onError]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.visibilityState === "hidden") onPausedChange(true);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () =>
      document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [onPausedChange]);

  const common = {
    difficulty,
    restartToken,
    paused,
    onHud,
    onResult,
    onSound: playSound,
  };

  const runtime = (() => { switch (gameId) {
    case "zikr-runner":
      return <ZikrRunnerGame {...common} />;
    case "zikr-memory":
      return <ZikrMemoryGame {...common} />;
    case "wudu-challenge":
      return <WuduChallengeGame {...common} />;
    case "verse-puzzle":
      return <VersePuzzleGame {...common} />;
    case "zikr-quiz":
      return <ZikrQuizGame {...common} />;
    case "mosque-adventure":
      return <MosqueAdventureGame {...common} />;
    case "zikr-road":
      return <ZikrRoadGame {...common} />;
    case "zikr-jump":
      return <ZikrJumpGame {...common} />;
    case "hilal-fly":
      return <HilalFlyGame {...common} />;
    case "good-deeds":
      return <GoodDeedsGame {...common} />;
    case "mosque-cleanup":
      return <MosqueCleanupGame {...common} />;
    case "zikr-coloring":
      return <ZikrColoringGame {...common} />;
    case "letter-lab":
      return <KidsLetterLabGame {...common} />;
    default:
      return (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-6 text-center text-rose-100">
          اللعبة غير متاحة حاليًا.
        </div>
      );
    }
  })();

  return (
    <RuntimeErrorBoundary
      key={gameId + ":" + restartToken + ":" + recoveryKey}
      isEnglish={isEnglish}
      onError={onError}
      onRetry={() => {
        setRecoveryKey(value => value + 1);
        onError("");
      }}
    >
      {runtime}
    </RuntimeErrorBoundary>
  );
}

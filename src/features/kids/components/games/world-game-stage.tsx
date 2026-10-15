"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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

  const localTone = useRef<ToneFeedback | null>(null);

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
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [onPausedChange]);

  const common = {
    difficulty,
    restartToken,
    paused,
    onHud,
    onResult,
    onSound: playSound,
  };

  switch (gameId) {
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
    default:
      return <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-6 text-center text-rose-100">اللعبة غير متاحة حاليًا.</div>;
  }
}

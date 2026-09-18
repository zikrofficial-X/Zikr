"use client";

import { useEffect, useRef } from "react";
import type { GameId } from "@/lib/games/registry";
import type { ArcadeGameScene, ArcadeHud } from "@/lib/games/arcade/arcade-scene";

export type ArcadeGameProps = {
  gameId: Exclude<GameId, "zikr-runner" | "zikr-memory" | "wudu-challenge" | "verse-puzzle" | "zikr-quiz" | "good-deeds" | "mosque-cleanup" | "zikr-coloring">;
  muted: boolean;
  onReady: (scene: ArcadeGameScene) => void;
  onHud: (hud: ArcadeHud) => void;
  onGameOver: (hud: ArcadeHud) => void;
  onError: (message: string) => void;
};

export function ArcadeGame({ gameId, muted, onReady, onHud, onGameOver, onError }: ArcadeGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ArcadeGameScene | null>(null);
  const onReadyRef = useRef(onReady);
  const onHudRef = useRef(onHud);
  const onGameOverRef = useRef(onGameOver);
  const onErrorRef = useRef(onError);
  const mutedRef = useRef(muted);

  useEffect(() => {
    onReadyRef.current = onReady;
    onHudRef.current = onHud;
    onGameOverRef.current = onGameOver;
    onErrorRef.current = onError;
    mutedRef.current = muted;
  }, [muted, onError, onGameOver, onHud, onReady]);

  useEffect(() => {
    let cancelled = false;
    let game: import("phaser").Game | null = null;

    async function start() {
      try {
        const [{ default: Phaser }, { ArcadeGameScene }] = await Promise.all([
          import("phaser"),
          import("@/lib/games/arcade/arcade-scene"),
        ]);
        if (cancelled || !mountRef.current) return;
        const scene = new ArcadeGameScene(gameId, {
          onReady: readyScene => {
            sceneRef.current = readyScene;
            readyScene.setMuted(mutedRef.current);
            onReadyRef.current(readyScene);
          },
          onHud: hud => onHudRef.current(hud),
          onGameOver: hud => onGameOverRef.current(hud),
        });
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: mountRef.current,
          width: 720,
          height: 640,
          backgroundColor: "#071b24",
          scene,
          physics: { default: "arcade", arcade: { debug: false } },
          scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
          render: { antialias: true, roundPixels: true },
        });
      } catch (error) {
        if (!cancelled) {
          console.error("[KidsGame] Failed to initialize arcade runtime", error);
          onErrorRef.current("تعذر تشغيل اللعبة على هذا الجهاز حاليًا.");
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      sceneRef.current = null;
      if (game) {
        game.destroy(true);
        game = null;
      }
    };
  }, [gameId]);

  useEffect(() => {
    sceneRef.current?.setMuted(muted);
  }, [muted]);

  return <div ref={mountRef} className="relative min-h-[420px] w-full touch-none overflow-hidden rounded-2xl border border-brand-gold/30 bg-[#071b24] shadow-2xl" role="application" aria-label="لعبة تفاعلية من عالم ذِكر" />;
}

"use client";

import { useEffect, useRef } from "react";
import type { ZikrRunnerScene, RunnerHud } from "@/lib/games/zikr-runner/runner-scene";

export type ZikrRunnerGameProps = {
  muted: boolean;
  onReady: (scene: ZikrRunnerScene) => void;
  onHud: (hud: RunnerHud) => void;
  onGameOver: (hud: RunnerHud) => void;
  onError: (message: string) => void;
};

export function ZikrRunnerGame({
  muted,
  onReady,
  onHud,
  onGameOver,
  onError,
}: ZikrRunnerGameProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ZikrRunnerScene | null>(null);
  const onReadyRef = useRef(onReady);
  const onHudRef = useRef(onHud);
  const onGameOverRef = useRef(onGameOver);
  const onErrorRef = useRef(onError);
  const mutedRef = useRef(muted);

  useEffect(() => {
    onReadyRef.current = onReady;
    mutedRef.current = muted;
    onHudRef.current = onHud;
    onGameOverRef.current = onGameOver;
    onErrorRef.current = onError;
  }, [muted, onError, onGameOver, onHud, onReady]);

  useEffect(() => {
    let cancelled = false;
    let game: import("phaser").Game | null = null;

    async function start() {
      try {
        const [{ default: Phaser }, { ZikrRunnerScene }] = await Promise.all([
          import("phaser"),
          import("@/lib/games/zikr-runner/runner-scene"),
        ]);
        if (cancelled || !mountRef.current) return;

        const scene = new ZikrRunnerScene({
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
          height: 720,
          backgroundColor: "#071b24",
          scene,
          physics: {
            default: "arcade",
            arcade: { debug: false },
          },
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          render: {
            antialias: true,
            roundPixels: true,
          },
        });
      } catch (error) {
        if (!cancelled) {
          console.error("[KidsGame] Failed to initialize ZIKR Runner", error);
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
  }, []);

  useEffect(() => {
    sceneRef.current?.setMuted(muted);
  }, [muted]);

  return (
    <div
      ref={mountRef}
      className="relative min-h-[480px] w-full overflow-hidden rounded-2xl border border-brand-gold/30 bg-[#071b24] shadow-2xl"
      role="application"
      aria-label="لعبة ذِكر رانر"
    />
  );
}

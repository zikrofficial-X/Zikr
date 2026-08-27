"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameResultPayload } from "@/lib/games/registry";
import type { ZikrRunnerScene, RunnerHud } from "@/lib/games/zikr-runner/runner-scene";
import { enqueueGameResult, getQueuedGameResultCount, syncQueuedGameResults } from "@/lib/games/offline-queue";
import { ZikrRunnerGame } from "./zikr-runner-game";

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-SA").format(value);
}

export function KidsGameShell() {
  const [scene, setScene] = useState<ZikrRunnerScene | null>(null);
  const [hud, setHud] = useState<RunnerHud>({ score: 0, collectibles: 0, distance: 0, speed: 230 });
  const [muted, setMuted] = useState(false);
  const [gameOver, setGameOver] = useState<RunnerHud | null>(null);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const lastHudUpdate = useRef(0);
  const gameFrameRef = useRef<HTMLDivElement | null>(null);

  const refreshQueue = useCallback(async () => {
    setQueuedCount(await getQueuedGameResultCount());
  }, []);

  useEffect(() => {
    void refreshQueue();
    const sync = () => {
      void syncQueuedGameResults().finally(refreshQueue);
    };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [refreshQueue]);

  const handleHud = useCallback((nextHud: RunnerHud) => {
    const now = Date.now();
    if (now - lastHudUpdate.current < 180) return;
    lastHudUpdate.current = now;
    setHud(nextHud);
  }, []);

  const submitResult = useCallback(async (result: RunnerHud) => {
    const payload: Omit<GameResultPayload, "clientSubmissionId"> = {
      gameId: "zikr-runner",
      score: Math.max(0, Math.min(100_000, Math.floor(result.score))),
      collectibles: Math.max(0, Math.min(10_000, Math.floor(result.collectibles))),
      distance: Math.max(0, Math.min(1_000_000, Math.floor(result.distance))),
      difficulty: "easy",
      metadata: { source: "zikr-runner" },
    };

    if (!navigator.onLine) {
      await enqueueGameResult(payload);
      setMessage("تم حفظ النتيجة على جهازك وستتم مزامنتها عند عودة الاتصال.");
      await refreshQueue();
      return;
    }

    try {
      const response = await fetch("/api/kids/games/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...payload, clientSubmissionId: crypto.randomUUID() }),
      });
      if (response.ok) {
        setMessage("تم حفظ نتيجتك بنجاح.");
      } else if (response.status === 401) {
        await enqueueGameResult(payload);
        setMessage("يمكنك اللعب دون تسجيل الدخول؛ ستحفظ النتيجة محليًا حتى تسجل الدخول.");
        await refreshQueue();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch {
      await enqueueGameResult(payload);
      setMessage("تعذر المزامنة الآن، فتم حفظ النتيجة محليًا للمحاولة لاحقًا.");
      await refreshQueue();
    }
  }, [refreshQueue]);

  const handleReady = useCallback((readyScene: ZikrRunnerScene) => {
    setScene(readyScene);
    setInitializing(false);
  }, []);

  const handleGameOver = useCallback((result: RunnerHud) => {
    setHud(result);
    setGameOver(result);
    void submitResult(result);
  }, [submitResult]);

  const restart = useCallback(() => {
    setGameOver(null);
    setPaused(false);
    setMessage("");
    scene?.restartGame();
  }, [scene]);

  const togglePause = useCallback(() => {
    if (!scene || gameOver) return;
    if (scene.scene.isPaused()) {
      scene.resumeGame();
      setPaused(false);
    } else {
      scene.pauseGame();
      setPaused(true);
    }
  }, [gameOver, scene]);

  const toggleFullscreen = useCallback(async () => {
    const element = gameFrameRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch {
      setMessage("لا يدعم هذا المتصفح وضع ملء الشاشة.");
    }
  }, []);

  return (
    <section className="space-y-4" dir="rtl" aria-labelledby="game-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-emerald/80">رحلة النجوم</p>
          <h2 id="game-heading" className="text-2xl font-bold text-brand-gold">ذِكر رانر</h2>
        </div>
        <Link href="/kids" className="text-sm text-brand-cream/70 underline underline-offset-4 hover:text-brand-gold">
          العودة إلى قسم الأطفال
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-brand-gold/20 bg-black/20 p-3 text-center" aria-live="polite">
        <div><span className="block text-xs text-brand-cream/60">النقاط</span><strong className="text-lg text-brand-gold">{formatNumber(hud.score)}</strong></div>
        <div><span className="block text-xs text-brand-cream/60">النجوم</span><strong className="text-lg text-brand-gold">{formatNumber(hud.collectibles)}</strong></div>
        <div><span className="block text-xs text-brand-cream/60">المسافة</span><strong className="text-lg text-brand-gold">{formatNumber(hud.distance)}م</strong></div>
      </div>

      <div ref={gameFrameRef} className="relative">
        <ZikrRunnerGame
          muted={muted}
          onReady={handleReady}
          onHud={handleHud}
          onGameOver={handleGameOver}
          onError={() => {
            setInitializing(false);
            setMessage("تعذر تشغيل اللعبة على هذا الجهاز حاليًا.");
          }}
        />
        {initializing && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#071b24]/90 text-brand-cream" role="status">
            جاري تجهيز اللعبة...
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#071b24]/90 p-6 text-center">
            <div className="space-y-4">
              <p className="text-3xl font-bold text-brand-gold">أحسنت المحاولة</p>
              <p className="text-brand-cream/80">جمعت {formatNumber(gameOver.collectibles)} نجمة وقطعت {formatNumber(gameOver.distance)} متر.</p>
              <p className="text-xl font-bold text-brand-emerald">النقاط: {formatNumber(gameOver.score)}</p>
              <Button onClick={restart}>العب مرة أخرى</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" variant="outline" onClick={togglePause} disabled={!scene || Boolean(gameOver)} aria-label={paused ? "متابعة اللعبة" : "إيقاف اللعبة مؤقتًا"}>{paused ? "متابعة" : "إيقاف مؤقت"}</Button>
        <Button type="button" variant="outline" onClick={() => { setMuted(scene?.toggleMute() ?? !muted); }} aria-pressed={muted} aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}>{muted ? "تشغيل الصوت" : "كتم الصوت"}</Button>
        <Button type="button" variant="outline" onClick={toggleFullscreen} aria-label="فتح اللعبة بملء الشاشة">ملء الشاشة</Button>
      </div>

      <div className="rounded-xl border border-brand-emerald/20 bg-brand-emerald/5 p-4 text-sm leading-relaxed text-brand-cream/75">
        استخدم الأسهم أو A وD للتنقل، وW أو المسافة للقفز. على الهاتف اسحب يمينًا أو يسارًا للتنقل واسحب إلى الأعلى للقفز. لا تجعل السرعة أهم من التعلم؛ خذ استراحة متى شئت.
      </div>
      {message && <p className="text-center text-sm text-brand-emerald" role="status">{message}</p>}
      {queuedCount > 0 && <p className="text-center text-xs text-brand-cream/60">نتائج محفوظة بانتظار المزامنة: {formatNumber(queuedCount)}</p>}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getGameDefinition, type GameDifficulty, type GameId, type GameResultPayload } from "@/lib/games/registry";
import { enqueueGameResult, getQueuedGameResultCount, syncQueuedGameResults } from "@/lib/games/offline-queue";
import { WorldGameStage, type StageController, type WorldHud } from "@/components/kids/games/world-game-stage";

function formatNumber(value: number) { return new Intl.NumberFormat("ar-SA").format(value); }
function createSubmissionId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `game-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export type KidsWorldGameShellProps = { gameId: GameId; initialDifficulty?: GameDifficulty };

export function KidsWorldGameShell({ gameId, initialDifficulty }: KidsWorldGameShellProps) {
  const definition = getGameDefinition(gameId)!;
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty ?? definition.defaultDifficulty);
  const [controller, setController] = useState<StageController | null>(null);
  const [hud, setHud] = useState<WorldHud>({ score: 0, collectibles: 0, distance: 0, combo: 0, level: 1, completed: false });
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [result, setResult] = useState<WorldHud | null>(null);
  const [message, setMessage] = useState("");
  const [queuedCount, setQueuedCount] = useState(0);
  const [restartToken, setRestartToken] = useState(0);
  const [initializing, setInitializing] = useState(true);
  const lastHudUpdate = useRef(0);

  const refreshQueue = useCallback(async () => setQueuedCount(await getQueuedGameResultCount()), []);
  useEffect(() => {
    void refreshQueue();
    const sync = () => { void syncQueuedGameResults().finally(refreshQueue); };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [refreshQueue]);

  const handleHud = useCallback((next: WorldHud) => {
    const now = Date.now();
    if (now - lastHudUpdate.current < 120) return;
    lastHudUpdate.current = now;
    setHud(next);
  }, []);

  const submitResult = useCallback(async (next: WorldHud) => {
    const payload: Omit<GameResultPayload, "clientSubmissionId"> = {
      gameId,
      score: Math.max(0, Math.floor(next.score)),
      collectibles: Math.max(0, Math.floor(next.collectibles)),
      distance: Math.max(0, Math.floor(next.distance)),
      difficulty,
      level: Math.max(0, Math.floor(next.level)),
      combo: Math.max(0, Math.floor(next.combo)),
      completed: next.completed,
      metadata: { source: "kids-world", runtime: definition.runtimeKind },
    };
    const clientSubmissionId = createSubmissionId();
    if (!navigator.onLine) {
      await enqueueGameResult({ ...payload, clientSubmissionId });
      setMessage("تم حفظ النتيجة على جهازك وستتم مزامنتها عند عودة الاتصال.");
      await refreshQueue();
      return;
    }
    try {
      const response = await fetch("/api/kids/games/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...payload, clientSubmissionId }),
      });
      if (response.ok) setMessage("تم حفظ نتيجتك بنجاح.");
      else if (response.status === 401) {
        await enqueueGameResult({ ...payload, clientSubmissionId });
        setMessage("يمكنك اللعب دون تسجيل الدخول؛ ستحفظ النتيجة محليًا حتى تسجل الدخول.");
        await refreshQueue();
      } else throw new Error(`HTTP ${response.status}`);
    } catch {
      await enqueueGameResult({ ...payload, clientSubmissionId });
      setMessage("تعذر المزامنة الآن، فتم حفظ النتيجة محليًا للمحاولة لاحقًا.");
      await refreshQueue();
    }
  }, [definition.runtimeKind, difficulty, gameId, refreshQueue]);

  const handleResult = useCallback((next: WorldHud) => {
    setHud(next); setResult(next); setPaused(false); void submitResult(next);
  }, [submitResult]);

  const restart = useCallback(() => { setResult(null); setMessage(""); setPaused(false); setRestartToken(value => value + 1); }, []);
  const togglePause = useCallback(() => {
    if (!controller || result) return;
    if (paused) { controller.resume(); setPaused(false); } else { controller.pause(); setPaused(true); }
  }, [controller, paused, result]);
  const toggleFullscreen = useCallback(async () => {
    const element = document.getElementById("kids-world-game-frame");
    if (!element) return;
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await element.requestFullscreen(); }
    catch { setMessage("لا يدعم هذا المتصفح وضع ملء الشاشة."); }
  }, []);
  const handleStageReady = useCallback((value: StageController | null) => {
    setController(value);
    setInitializing(false);
  }, []);
  const handleStageError = useCallback((messageText: string) => {
    setInitializing(false);
    setMessage(messageText);
  }, []);

  return <section className="space-y-4" dir="rtl" aria-labelledby="game-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-brand-emerald/80">عالم ذِكر للأطفال</p><h2 id="game-heading" className="text-2xl font-bold text-brand-gold">{definition.titleAr}</h2></div><Link href="/kids/games" className="text-sm text-brand-cream/70 underline underline-offset-4 hover:text-brand-gold">العودة إلى الألعاب</Link></div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-cream/10 bg-black/20 p-3"><div className="flex flex-wrap gap-2" aria-label="مستوى الصعوبة">{definition.difficulties.map(item => <button key={item} type="button" onClick={() => { if (!result) { setDifficulty(item); restart(); } }} aria-pressed={difficulty === item} className={`rounded-lg px-3 py-2 text-sm ${difficulty === item ? "bg-brand-gold text-black" : "border border-brand-cream/15 text-brand-cream/70"}`}>{item === "easy" ? "سهل" : item === "normal" ? "متوسط" : "متقدم"}</button>)}</div><span className="text-sm text-brand-cream/60">{definition.category}</span></div>
    <div className="grid grid-cols-5 gap-2 rounded-xl border border-brand-gold/20 bg-black/20 p-3 text-center" aria-live="polite"><div><span className="block text-xs text-brand-cream/60">النقاط</span><strong className="text-lg text-brand-gold">{formatNumber(hud.score)}</strong></div><div><span className="block text-xs text-brand-cream/60">النجوم</span><strong className="text-lg text-brand-gold">{formatNumber(hud.collectibles)}</strong></div><div><span className="block text-xs text-brand-cream/60">المسافة</span><strong className="text-lg text-brand-gold">{formatNumber(hud.distance)}م</strong></div><div><span className="block text-xs text-brand-cream/60">السلسلة</span><strong className="text-lg text-brand-gold">{formatNumber(hud.combo)}</strong></div><div><span className="block text-xs text-brand-cream/60">المستوى</span><strong className="text-lg text-brand-gold">{formatNumber(hud.level)}</strong></div></div>
    <div id="kids-world-game-frame" className="relative"><WorldGameStage gameId={gameId} difficulty={difficulty} muted={muted} paused={paused} restartToken={restartToken} onPausedChange={setPaused} onReady={handleStageReady} onHud={handleHud} onResult={handleResult} onError={handleStageError} />{initializing && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#071b24]/90 text-brand-cream" role="status">جاري تجهيز اللعبة...</div>}{result && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#071b24]/90 p-6 text-center"><div className="space-y-4"><p className="text-3xl font-bold text-brand-gold">أحسنت المحاولة</p><p className="text-brand-cream/80">النقاط: {formatNumber(result.score)} — النجوم: {formatNumber(result.collectibles)}</p><Button type="button" onClick={restart}>العب مرة أخرى</Button></div></div>}</div>
    <div className="flex flex-wrap justify-center gap-3"><Button type="button" variant="outline" onClick={togglePause} disabled={!controller || Boolean(result)} aria-label={paused ? "متابعة اللعبة" : "إيقاف اللعبة مؤقتًا"}>{paused ? "متابعة" : "إيقاف مؤقت"}</Button><Button type="button" variant="outline" onClick={() => setMuted(value => { const next = !value; controller?.setMuted(next); return next; })} aria-pressed={muted} aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}>{muted ? "تشغيل الصوت" : "كتم الصوت"}</Button><Button type="button" variant="outline" onClick={toggleFullscreen} aria-label="فتح اللعبة بملء الشاشة">ملء الشاشة</Button></div>
    <p className="rounded-xl border border-brand-emerald/20 bg-brand-emerald/5 p-4 text-sm leading-relaxed text-brand-cream/75" role="note">{definition.descriptionAr} استخدم اللمس أو لوحة المفاتيح، وخذ استراحة متى شئت؛ التعلم أهم من السرعة.</p>
    {message && <p className="text-center text-sm text-brand-emerald" role="status">{message}</p>}{queuedCount > 0 && <p className="text-center text-xs text-brand-cream/60">نتائج محفوظة بانتظار المزامنة: {formatNumber(queuedCount)}</p>}
  </section>;
}

export function KidsGameShell() { return <KidsWorldGameShell gameId="zikr-runner" />; }

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/layout/language-provider";
import { Button } from "@/components/ui/button";
import { getGameDefinition, type GameDifficulty, type GameId, type GameResultPayload } from "@/lib/games/registry";
import { enqueueGameResult, getQueuedGameResultCount, syncQueuedGameResults } from "@/lib/games/offline-queue";
import { WorldGameStage, type StageController, type WorldHud } from "@/features/kids/components/games/world-game-stage";
import { KidsGameArt } from "@/features/kids/components/games/kids-game-art";
import { getDailyMission, getMissionProgress } from "@/lib/games/game-missions";
import { getGameInstructions } from "@/lib/games/game-instructions";

function formatNumber(value: number, isEnglish: boolean) { return new Intl.NumberFormat(isEnglish ? "en-US" : "ar-SA").format(value); }
function createSubmissionId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `game-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export type KidsWorldGameShellProps = { gameId: GameId; initialDifficulty?: GameDifficulty };

export function KidsWorldGameShell({ gameId, initialDifficulty }: KidsWorldGameShellProps) {
  const { isEnglish } = useLanguage();
  const definition = getGameDefinition(gameId)!;
  const englishSourceMissing =
    isEnglish &&
    ["zikr-memory", "wudu-challenge", "verse-puzzle", "zikr-quiz"].includes(gameId);
  const difficultyLabels = isEnglish
    ? { easy: "Easy", normal: "Normal", hard: "Advanced" }
    : { easy: "سهل", normal: "متوسط", hard: "متقدم" };
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
  const [hasStarted, setHasStarted] = useState(false);
  const instructions = useMemo(() => getGameInstructions(gameId, isEnglish ? "en" : "ar"), [gameId, isEnglish]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedRef = useRef(0);
  const runningSinceRef = useRef<number | null>(null);
  const lastHudUpdate = useRef(0);
  const dailyMission = useMemo(() => getDailyMission(gameId), [gameId]);
  const missionProgress = useMemo(() => getMissionProgress(dailyMission, hud), [dailyMission, hud]);

  const refreshQueue = useCallback(async () => setQueuedCount(await getQueuedGameResultCount()), []);
  useEffect(() => {
    void refreshQueue();
    const sync = () => { void syncQueuedGameResults().finally(refreshQueue); };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [refreshQueue]);

  const getElapsedSeconds = useCallback(() => {
    const runningSince = runningSinceRef.current;
    const activeSeconds = runningSince === null ? 0 : (Date.now() - runningSince) / 1000;
    return Math.max(0, Math.floor(elapsedRef.current + activeSeconds));
  }, []);

  useEffect(() => {
    const stopClock = () => {
      if (runningSinceRef.current !== null) {
        elapsedRef.current += Math.max(0, (Date.now() - runningSinceRef.current) / 1000);
        runningSinceRef.current = null;
      }
      setElapsedSeconds(Math.max(0, Math.floor(elapsedRef.current)));
    };

    const startClock = () => {
      if (!hasStarted || paused || result || document.visibilityState === "hidden") {
        stopClock();
        return;
      }
      if (runningSinceRef.current === null) runningSinceRef.current = Date.now();
      setElapsedSeconds(getElapsedSeconds());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") stopClock();
      else startClock();
    };

    startClock();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const timer = window.setInterval(() => { if (hasStarted) setElapsedSeconds(getElapsedSeconds()); }, 1000);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopClock();
    };
  }, [getElapsedSeconds, hasStarted, paused, result, restartToken]);


  const handleHud = useCallback((next: WorldHud) => {
    const now = Date.now();
    if (now - lastHudUpdate.current < 120) return;
    lastHudUpdate.current = now;
    const whole = (value: number) => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    setHud({
      ...next,
      score: whole(next.score),
      collectibles: whole(next.collectibles),
      distance: whole(next.distance),
      combo: whole(next.combo),
      level: whole(next.level),
      timeSeconds: whole(getElapsedSeconds()),
      mistakes: whole(next.mistakes ?? 0),
      accuracy: typeof next.accuracy === "number" && Number.isFinite(next.accuracy)
        ? Math.max(0, Math.min(100, next.accuracy))
        : undefined,
    });
  }, [getElapsedSeconds]);

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
      timeSeconds: Math.max(0, Math.floor(next.timeSeconds ?? getElapsedSeconds())),
      metadata: {
        source: "kids-world",
        runtime: definition.runtimeKind,
        dailyMissionId: dailyMission.id,
        dailyMissionCompleted: getMissionProgress(dailyMission, next).completed,
        roundTimeSeconds: Math.max(0, Math.floor(next.timeSeconds ?? getElapsedSeconds())),
        mistakes: Math.max(0, Math.floor(next.mistakes ?? 0)),
        accuracy: typeof next.accuracy === "number" ? Math.max(0, Math.min(100, next.accuracy)) : undefined,
      },
    };
    const clientSubmissionId = createSubmissionId();
    if (!navigator.onLine) {
      await enqueueGameResult({ ...payload, clientSubmissionId });
      setMessage(isEnglish ? "Your result was saved on this device and will sync when you reconnect." : "تم حفظ النتيجة على جهازك وستتم مزامنتها عند عودة الاتصال.");
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
      if (response.ok) setMessage(isEnglish ? "Your result was saved successfully." : "تم حفظ نتيجتك بنجاح.");
      else if (response.status === 401) {
        await enqueueGameResult({ ...payload, clientSubmissionId });
        setMessage(isEnglish ? "You can play without signing in; your result is stored locally until you sign in." : "يمكنك اللعب دون تسجيل الدخول؛ ستحفظ النتيجة محليًا حتى تسجل الدخول.");
        await refreshQueue();
      } else throw new Error(`HTTP ${response.status}`);
    } catch {
      await enqueueGameResult({ ...payload, clientSubmissionId });
      setMessage(isEnglish ? "Sync is unavailable right now, so the result was saved locally for another attempt." : "تعذر المزامنة الآن، فتم حفظ النتيجة محليًا للمحاولة لاحقًا.");
      await refreshQueue();
    }
  }, [dailyMission, definition.runtimeKind, difficulty, gameId, getElapsedSeconds, isEnglish, refreshQueue]);

  const handleResult = useCallback((next: WorldHud) => {
    const completedRound = { ...next, timeSeconds: Math.max(0, Math.floor(next.timeSeconds ?? getElapsedSeconds())) };
    setHud(completedRound); setResult(completedRound); setPaused(false); void submitResult(completedRound);
  }, [getElapsedSeconds, submitResult]);

  const restart = useCallback(() => {
    elapsedRef.current = 0;
    runningSinceRef.current = null;
    setElapsedSeconds(0);
    setResult(null); setMessage(""); setPaused(false); setRestartToken(value => value + 1);
  }, []);
  const togglePause = useCallback(() => {
    if (!controller || result) return;
    if (paused) { controller.resume(); setPaused(false); } else { controller.pause(); setPaused(true); }
  }, [controller, paused, result]);
  const toggleFullscreen = useCallback(async () => {
    const element = document.getElementById("kids-world-game-frame");
    if (!element) return;
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await element.requestFullscreen(); }
    catch { setMessage(isEnglish ? "This browser does not support fullscreen mode." : "لا يدعم هذا المتصفح وضع ملء الشاشة."); }
  }, [isEnglish]);
  const handleStageReady = useCallback((value: StageController | null) => {
    setController(value);
    setInitializing(false);
  }, []);
  const handleStageError = useCallback((messageText: string) => {
    setInitializing(false);
    setMessage(messageText);
  }, []);

  const earnedStars = result ? (result.completed ? 3 : result.collectibles >= 2 ? 2 : result.collectibles >= 1 ? 1 : 0) : 0;

  return (
    <section className="space-y-4" dir={isEnglish ? "ltr" : "rtl"} aria-labelledby="game-heading">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-emerald/80">{isEnglish ? "ZIKR Kids" : "عالم ذِكر للأطفال"}</p>
          <h2 id="game-heading" className="text-2xl font-bold text-brand-gold">{isEnglish ? definition.titleEn : definition.titleAr}</h2>
          <p className="max-w-2xl text-sm leading-7 text-brand-cream/65">{isEnglish ? definition.storyEn : definition.storyAr}</p>
          <Link href="/kids/games" className="inline-flex pt-2 text-sm text-brand-cream/70 underline underline-offset-4 hover:text-brand-gold">
            {isEnglish ? "Back to games" : "العودة إلى الألعاب"}
          </Link>
        </div>
        <div className="aspect-[2/1] overflow-hidden rounded-2xl border border-brand-gold/20 bg-black/20 md:aspect-[5/4]">
          <KidsGameArt gameId={gameId} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-cream/10 bg-black/20 p-3">
        <div className="flex flex-wrap gap-2" aria-label={isEnglish ? "Difficulty" : "مستوى الصعوبة"}>
          {definition.difficulties.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { if (!result) { setDifficulty(item); restart(); } }}
              aria-pressed={difficulty === item}
              className={"rounded-lg px-3 py-2 text-sm " + (difficulty === item ? "bg-brand-gold text-black" : "border border-brand-cream/15 text-brand-cream/70")}
            >
              {difficultyLabels[item]}
            </button>
          ))}
        </div>
        <span className="text-sm text-brand-cream/60">{isEnglish ? definition.categoryEn : definition.category}</span>
      </div>

      {!hasStarted && !englishSourceMissing && (
        <section aria-labelledby="game-briefing-heading" className="overflow-hidden rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-gold/[0.08] via-black/20 to-brand-emerald/[0.06] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black tracking-[0.18em] text-brand-emerald">{isEnglish ? "HOW TO PLAY" : "طريقة اللعب"}</p>
              <h3 id="game-briefing-heading" className="mt-2 text-xl font-black text-brand-gold">{instructions.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/75">{instructions.intro}</p>
            </div>
            <span className="rounded-xl border border-brand-gold/20 bg-black/20 px-3 py-2 text-xs font-bold text-brand-gold">{isEnglish ? "Goal" : "الهدف"}: {isEnglish ? definition.goalEn : definition.goalAr}</span>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {instructions.steps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gold/15 text-sm font-black text-brand-gold">{index + 1}</span>
                <span className="text-sm leading-6 text-brand-cream/80">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-emerald/15 bg-brand-emerald/[0.04] p-3">
              <p className="text-xs font-black text-brand-emerald">{isEnglish ? "Touch controls" : "التحكم باللمس"}</p>
              <p className="mt-1 text-sm leading-6 text-brand-cream/70">{instructions.touchControls}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <p className="text-xs font-black text-brand-cream/75">{isEnglish ? "Keyboard" : "لوحة المفاتيح"}</p>
              <p className="mt-1 text-sm leading-6 text-brand-cream/60">{instructions.keyboardControls}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-xs leading-6 text-brand-cream/50">{isEnglish ? "There is no rush. You can pause whenever you need." : "مش محتاج تستعجل؛ تقدر توقف اللعبة مؤقتًا وقت ما تحتاج."}</p>
            <Button type="button" onClick={() => setHasStarted(true)}>{isEnglish ? "Start playing" : "ابدأ اللعب"}</Button>
          </div>
        </section>
      )}

      {hasStarted && (
        <>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-brand-gold/20 bg-black/20 p-3 text-center min-[420px]:grid-cols-5" aria-live="polite">
        {[
          { label: isEnglish ? "Score" : "النقاط", value: hud.score },
          { label: isEnglish ? "Stars" : "النجوم", value: hud.collectibles },
          { label: isEnglish ? "Distance" : "المسافة", value: hud.distance },
          { label: isEnglish ? "Combo" : "السلسلة", value: hud.combo },
          { label: isEnglish ? "Level" : "المستوى", value: hud.level },
        ].map((item) => (
          <div key={item.label}>
            <span className="block text-xs text-brand-cream/60">{item.label}</span>
            <strong className="text-lg text-brand-gold">{formatNumber(item.value, isEnglish)}{item.label === (isEnglish ? "Distance" : "المسافة") ? (isEnglish ? "m" : "م") : ""}</strong>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs text-brand-cream/55" aria-label={isEnglish ? "Round statistics" : "إحصائيات الجولة"}>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2"><span className="block">{isEnglish ? "Time" : "الوقت"}</span><strong className="mt-1 block text-brand-cream">{formatNumber(elapsedSeconds, isEnglish)} {isEnglish ? "s" : "ث"}</strong></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2"><span className="block">{isEnglish ? "Combo" : "السلسلة"}</span><strong className="mt-1 block text-brand-gold">{formatNumber(hud.combo, isEnglish)}</strong></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2"><span className="block">{isEnglish ? "Progress" : "التقدم"}</span><strong className="mt-1 block text-brand-emerald">{formatNumber(hud.collectibles, isEnglish)}</strong></div>
      </div>

      <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-4" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[0.18em] text-brand-gold/75">{isEnglish ? "Daily mission" : "مهمة اليوم"}</p>
            <h3 className="mt-1 text-base font-bold text-brand-cream">{isEnglish ? dailyMission.titleEn : dailyMission.titleAr}</h3>
            <p className="mt-1 text-sm text-brand-cream/65">{isEnglish ? dailyMission.descriptionEn : dailyMission.descriptionAr}</p>
          </div>
          <span className={"rounded-full border px-3 py-1 text-xs font-bold " + (missionProgress.completed ? "border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald" : "border-brand-gold/25 bg-black/10 text-brand-gold")}>
            {missionProgress.completed
              ? (isEnglish ? "Completed" : "مكتملة")
              : (isEnglish ? dailyMission.rewardLabelEn : dailyMission.rewardLabel)}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-gold via-brand-emerald to-sky-300 transition-[width] duration-200" style={{ width: missionProgress.percent + "%" }} />
        </div>
        <p className="mt-2 text-xs text-brand-cream/50">
          {missionProgress.value.toLocaleString(isEnglish ? "en-US" : "ar-EG")} / {missionProgress.target.toLocaleString(isEnglish ? "en-US" : "ar-EG")}
        </p>
      </div>

        </>
      )}

      <div id="kids-world-game-frame" className="relative min-w-0">
        {englishSourceMissing ? (
          <div className="grid min-h-[320px] place-items-center rounded-2xl border border-brand-gold/20 bg-black/20 p-6 text-center">
            <p className="max-w-xl text-sm leading-7 text-brand-cream/70">
              English educational content for this game is not published yet. The verified Arabic source is intentionally not shown in English mode.
            </p>
          </div>
        ) : !hasStarted ? null : (
          <>
            <WorldGameStage
              gameId={gameId}
              difficulty={difficulty}
              muted={muted}
              paused={paused}
              restartToken={restartToken}
              onPausedChange={setPaused}
              onReady={handleStageReady}
              onHud={handleHud}
              onResult={handleResult}
              onError={handleStageError}
            />
            {initializing && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#071b24]/90 text-brand-cream" role="status">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-brand-gold/20 border-t-brand-gold" />
                  <p>{isEnglish ? "Preparing your adventure..." : "بنجهز مغامرتك..."}</p>
                </div>
              </div>
            )}
            {result && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[radial-gradient(circle_at_top,rgba(199,168,107,0.18),transparent_40%),rgba(7,27,36,0.97)] p-4 sm:p-8">
                <div className="w-full max-w-md space-y-5 text-center">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-brand-gold/50 bg-brand-gold/10 text-4xl shadow-[0_0_50px_rgba(199,168,107,0.2)]" aria-hidden="true">{result.completed ? "🏆" : "🌱"}</div>
                  <div>
                    <p className="text-3xl font-black text-brand-gold">{result.completed ? (isEnglish ? "Great job! 🎉" : "أحسنت! 🎉") : (isEnglish ? "Nice round!" : "جولة جميلة!")}</p>
                    <p className="mt-2 text-sm leading-7 text-brand-cream/75">{result.completed ? (isEnglish ? definition.goalEn : definition.goalAr) : (isEnglish ? "Every attempt helps you improve. Try again and see what you discover." : "كل محاولة بتخليك أفضل. جرّب مرة تانية وشوف إيه اللي هتكتشفه.")}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1" aria-label={isEnglish ? "Round stars: " + earnedStars + " of 3" : "نجوم الجولة: " + earnedStars + " من 3"}>
                    {[1, 2, 3].map((star) => (
                      <span
                        key={star}
                        className={"text-4xl transition " + (star <= earnedStars ? "text-brand-gold drop-shadow-[0_0_10px_rgba(199,168,107,0.45)]" : "text-white/15")}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: isEnglish ? "Score" : "النقاط", value: result.score },
                      { label: isEnglish ? "Stars" : "النجوم", value: result.collectibles },
                      { label: isEnglish ? "Level" : "المستوى", value: result.level },
                      { label: isEnglish ? "Time" : "الوقت", value: result.timeSeconds ?? elapsedSeconds, suffix: isEnglish ? "s" : "ث" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                        <span className="block text-xs text-brand-cream/55">{item.label}</span>
                        <strong className="mt-1 block text-lg text-brand-gold">{formatNumber(item.value, isEnglish)}{item.suffix ?? ""}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button type="button" onClick={restart}>{isEnglish ? "🚀 New round" : "🚀 جولة جديدة"}</Button>
                    <Link href="/kids/games" className="grid min-h-11 place-items-center rounded-md border border-brand-cream/20 px-4 text-sm font-medium text-brand-cream transition hover:border-brand-gold hover:text-brand-gold">
                      {isEnglish ? "🎮 Choose another game" : "🎮 اختر لعبة أخرى"}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!englishSourceMissing && hasStarted && (
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={togglePause}
            disabled={!controller || Boolean(result)}
            aria-label={paused ? (isEnglish ? "Resume game" : "متابعة اللعبة") : (isEnglish ? "Pause game" : "إيقاف اللعبة مؤقتًا")}
          >
            {paused ? (isEnglish ? "Resume" : "متابعة") : (isEnglish ? "Pause" : "إيقاف مؤقت")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMuted((value) => {
              const next = !value;
              controller?.setMuted(next);
              return next;
            })}
            aria-pressed={muted}
            aria-label={muted ? (isEnglish ? "Unmute sound" : "تشغيل الصوت") : (isEnglish ? "Mute sound" : "كتم الصوت")}
          >
            {muted ? (isEnglish ? "Unmute" : "تشغيل الصوت") : (isEnglish ? "Mute" : "كتم الصوت")}
          </Button>
          <Button type="button" variant="outline" onClick={toggleFullscreen} aria-label={isEnglish ? "Open game fullscreen" : "فتح اللعبة بملء الشاشة"}>
            {isEnglish ? "Fullscreen" : "ملء الشاشة"}
          </Button>
        </div>
      )}

      <div className="grid gap-3 rounded-xl border border-brand-emerald/20 bg-brand-emerald/5 p-4 text-sm leading-relaxed text-brand-cream/75 sm:grid-cols-[1fr_auto] sm:items-center" role="note">
        <p>
          <strong className="text-brand-gold">{isEnglish ? "Round goal:" : "هدف الجولة:"}</strong>{" "}
          {isEnglish ? definition.goalEn : definition.goalAr}
          <br />
          {isEnglish ? definition.descriptionEn : definition.descriptionAr}{" "}
          {isEnglish ? "Use touch or a keyboard, and take a break whenever you like; learning matters more than speed." : "استخدم اللمس أو لوحة المفاتيح، وخذ استراحة متى شئت؛ التعلم أهم من السرعة."}
        </p>
        <span className="rounded-lg border border-brand-cream/10 bg-black/15 px-3 py-2 text-xs text-brand-cream/60">
          {isEnglish ? "Skill: " + definition.skillEn : "المهارة: " + definition.skillAr}
        </span>
      </div>

      {message && <p className="text-center text-sm text-brand-emerald" role="status">{message}</p>}
      {queuedCount > 0 && (
        <p className="text-center text-xs text-brand-cream/60">
          {isEnglish ? "Results waiting to sync: " : "نتائج محفوظة بانتظار المزامنة: "}
          {formatNumber(queuedCount, isEnglish)}
        </p>
      )}
    </section>
  );

}

export function KidsGameShell() { return <KidsWorldGameShell gameId="zikr-runner" />; }

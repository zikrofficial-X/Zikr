"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";
import { GameToast, GardenBackdrop, KidsGameHeader, KidsGameHud, KidsGameStage, KidsProgress, KidCharacter, MosqueBackdrop, StarToken } from "@/features/kids/components/games/kids-game-kit";
import { getGoodDeedsRules } from "@/lib/games/good-deeds";
import { getMosqueCleanupRules } from "@/lib/games/mosque-cleanup";
import { getZikrColoringRules } from "@/lib/games/zikr-coloring";
import { getKidsLevelMeta, KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";
import { accumulateGameLevel, createGameRunTotals } from "@/lib/games/run-stats";
import { seededShuffle } from "@/lib/games/gameplay-helpers";
import { KidsGameWorld } from "@/features/kids/components/games/kids-game-visuals";

type Props = { difficulty: GameDifficulty; restartToken: number; paused: boolean; onHud: (hud: WorldHud) => void; onResult: (result: WorldHud) => void; onSound: (event: GameSoundEvent) => void };

const levelLabel = (n: number) => "المستوى " + (n + 1) + "/" + KIDS_LEVEL_COUNT;

type Deed = { id: string; title: string; description: string; icon: string; color: string };
const DEEDS: Deed[] = [
  { id: "share", title: "صندوق المشاركة", description: "اختر شيئًا داخل العالم وشاركه مع الشخصية الأخرى.", icon: "🎁", color: "#f3c969" },
  { id: "welcome", title: "بوابة الترحيب", description: "رحّب بالضيف الافتراضي ثم افتح الباب.", icon: "🤝", color: "#5fd1a6" },
  { id: "plant", title: "حديقة صغيرة", description: "اسقِ نبتة العالم الخيالي لتزهر.", icon: "🌱", color: "#8ab6e2" },
  { id: "book", title: "رف المعرفة", description: "ضع الكتاب في الرف المناسب.", icon: "📘", color: "#d7a7e8" },
  { id: "lantern", title: "فانوس الطريق", description: "أشعل الفانوس ليضيء الطريق الهادئ.", icon: "🏮", color: "#f3c969" },
  { id: "help", title: "المساعدة", description: "ساعد الشخصية على حمل الصندوق داخل المشهد.", icon: "🧺", color: "#5fd1a6" },
  { id: "listen", title: "أذن الإصغاء", description: "استمع للشخصية واختر لحظة المساعدة المناسبة.", icon: "👂", color: "#9c86e8" },
  { id: "queue", title: "دورك الجميل", description: "انتظر دورك داخل المشهد ثم اختر التصرف الهادئ.", icon: "🧍", color: "#e28a5a" },
  { id: "clean", title: "مكان مرتب", description: "اجمع الأدوات المتناثرة داخل الصندوق الصحيح.", icon: "🧹", color: "#7ed6c1" },
  { id: "smile", title: "ابتسامة", description: "اختر تحية لطيفة قبل بدء المهمة.", icon: "🙂", color: "#f3c969" },
  { id: "water", title: "مساعدة بالماء", description: "قدّم كوب الماء إلى الشخصية الافتراضية.", icon: "🥤", color: "#8ab6e2" },
  { id: "guide", title: "الدليل الصغير", description: "أرشد الشخصية إلى المكان الصحيح عبر المسار.", icon: "🧭", color: "#5fd1a6" },
];

export function GoodDeedsGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: Props) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [actionSteps, setActionSteps] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("اختر مشهدًا وأكمله.");
  const advancingRef = useRef(false);
  const runTotalsRef = useRef(createGameRunTotals());
  const levelResetPendingRef = useRef(false);

  useEffect(() => {
    runTotalsRef.current = createGameRunTotals();
    setLevelIndex(0);
  }, [difficulty, restartToken]);
  const rules = getGoodDeedsRules(difficulty, levelIndex);
  const meta = getKidsLevelMeta("good-deeds", difficulty, levelIndex);
  const deeds = useMemo(() => seededShuffle(DEEDS, "deeds:" + meta.seed).slice(0, Math.min(DEEDS.length, rules.sceneCount)), [meta.seed, rules.sceneCount]);
  const complete = done.length === deeds.length;
  const score = done.length * rules.rewardPerScene;

  useEffect(() => { setDone([]); setActive(null); setActionSteps({}); setFeedback(meta.subtitleAr); levelResetPendingRef.current = true; advancingRef.current = false; }, [difficulty, levelIndex, meta.subtitleAr, restartToken]);

  useEffect(() => {
    const levelHud: WorldHud = { score: complete ? score + rules.completionBonus : score, collectibles: done.length, distance: 0, combo: done.length, level: levelIndex + 1, completed: complete && levelIndex === KIDS_LEVEL_COUNT - 1 };
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
      setFeedback("اكتمل " + levelLabel(levelIndex) + ". مشاهد جديدة في الطريق.");
      onSound("success");
      window.setTimeout(() => setLevelIndex(value => value + 1), 650);
    } else {
      const totals = accumulateGameLevel(runTotalsRef.current, levelTotals);
      runTotalsRef.current = totals;
      const finalHud: WorldHud = { ...levelHud, score: totals.score, collectibles: totals.collectibles, combo: totals.bestCombo, completed: true };
      onHud(finalHud);
      setFeedback("أكملت جميع مستويات أعمال الخير.");
      onSound("success");
      onResult(finalHud);
    }
  }, [complete, done.length, levelIndex, onHud, onResult, onSound, rules.completionBonus, score]);

  const finish = (id: string) => {
    if (paused || !active || done.includes(id)) return;
    const currentStep = actionSteps[id] ?? 0;
    if (currentStep < 2) {
      setActionSteps(value => ({ ...value, [id]: currentStep + 1 }));
      onSound("move");
      setFeedback("خطوة " + (currentStep + 2) + " من 3 في " + (deeds.find(d => d.id === id)?.title ?? "المشهد") + ".");
      return;
    }
    setDone(value => [...value, id]);
    setActive(null);
    setActionSteps(value => ({ ...value, [id]: 0 }));
    onSound("collect");
    setFeedback("اكتملت " + deeds.find(d => d.id === id)?.title + ".");
  };

  return (
    <KidsGameStage theme="garden" ariaLabel="أعمال الخير"><KidsGameWorld gameId="good-deeds" />
      <KidsGameHeader eyebrow="GOOD DEEDS" title="مغامرة أعمال الخير" description={meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={(done.length / Math.max(1, deeds.length)) * 100} label={levelLabel(levelIndex)} /></div>} />
      <div className="px-4 sm:px-6"><KidsGameHud items={[
        { label: "النقاط", value: complete ? score + rules.completionBonus : score, tone: "text-brand-gold" },
        { label: "المشاهد", value: done.length + "/" + deeds.length, tone: "text-brand-emerald" },
        { label: "السلسلة", value: done.length, tone: "text-violet-200" },
        { label: "المستوى", value: levelIndex + 1, tone: "text-amber-200" },
        { label: "الصعوبة", value: difficulty, tone: "text-sky-200" },
      ]} /></div>
      <div className="relative mx-4 mt-4 min-h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#09272b] sm:mx-6">
        <GardenBackdrop /><MosqueBackdrop compact />
        <div className="relative z-20 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          {deeds.map((deed, index) => {
            const doneAlready = done.includes(deed.id), isActive = active === deed.id;
            return <div key={deed.id} className={["rounded-[1.7rem] border p-4 transition", doneAlready ? "border-brand-emerald/30 bg-brand-emerald/10 opacity-65" : isActive ? "border-brand-gold/60 bg-brand-gold/10 -translate-y-1" : "border-white/10 bg-black/20 hover:border-brand-cream/20"].join(" ")}>
              <button type="button" disabled={paused || doneAlready} onClick={() => setActive(isActive ? null : deed.id)} className="w-full text-right">
                <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border text-2xl" style={{ borderColor: deed.color + "55", background: deed.color + "15" }}>{doneAlready ? "✓" : deed.icon}</span><span className="text-xs text-brand-cream/35">مشهد {index + 1}</span></div>
                <h4 className="mt-4 text-lg font-black text-brand-cream">{deed.title}</h4><p className="mt-2 text-sm leading-7 text-brand-cream/60">{deed.description}</p>
              </button>
              {isActive && !doneAlready && <div className="mt-4 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.05] p-3">
  <div className="flex items-center gap-3"><KidCharacter variant="helper" state="help" size={58} /><p className="text-xs leading-6 text-brand-cream/55">نفّذ 3 خطوات صغيرة لبناء العادة ثم أغلق المشهد.</p></div>
  <div className="mt-3 grid grid-cols-3 gap-2">
    {[1,2,3].map(step => <div key={step} className={"h-2 rounded-full " + (step <= (actionSteps[deed.id] ?? 0) ? "bg-brand-emerald" : "bg-white/10")} />)}
  </div>
  <button type="button" onClick={() => finish(deed.id)} className="mt-3 w-full rounded-xl bg-brand-gold px-4 py-3 text-sm font-black text-[#241c08]">{(actionSteps[deed.id] ?? 0) < 2 ? "تنفيذ الخطوة " + ((actionSteps[deed.id] ?? 0) + 1) : "إتمام المشهد"}</button>
</div>}
            </div>;
          })}
        </div>
      </div>
      <GameToast tone={complete && levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type CleanupItem = { id: string; name: string; icon: string; target: "books" | "lights" | "soft" | "green" };
type CleanupZone = { id: CleanupItem["target"]; title: string; icon: string };

const CLEANUP_ITEMS: CleanupItem[] = [
  { id: "book1", name: "كتاب", icon: "📘", target: "books" }, { id: "book2", name: "دفتر", icon: "📓", target: "books" },
  { id: "book3", name: "قصة", icon: "📗", target: "books" }, { id: "book4", name: "مصحف تعليمي", icon: "📕", target: "books" },
  { id: "lamp1", name: "مصباح", icon: "🪔", target: "lights" }, { id: "lamp2", name: "فانوس", icon: "🏮", target: "lights" },
  { id: "lamp3", name: "ضوء", icon: "💡", target: "lights" }, { id: "lamp4", name: "مصباح صغير", icon: "🔆", target: "lights" },
  { id: "pillow", name: "وسادة", icon: "🟣", target: "soft" }, { id: "ball", name: "كرة", icon: "⚽", target: "soft" },
  { id: "toy", name: "لعبة", icon: "🧸", target: "soft" }, { id: "mat", name: "حصيرة", icon: "🟩", target: "soft" },
  { id: "plant", name: "نبتة", icon: "🌿", target: "green" }, { id: "plant2", name: "شتلة", icon: "🌱", target: "green" },
  { id: "flower", name: "زهرة", icon: "🌷", target: "green" }, { id: "tree", name: "غصن", icon: "🌳", target: "green" },
];
const CLEANUP_ZONES: CleanupZone[] = [
  { id: "books", title: "رف الكتب", icon: "📚" }, { id: "lights", title: "ركن الإضاءة", icon: "💡" },
  { id: "soft", title: "سلة اللعب الهادئ", icon: "🧺" }, { id: "green", title: "ركن النباتات", icon: "🌿" },
];

export function MosqueCleanupGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: Props) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("اختر غرضًا ثم اضغط منطقة الترتيب المناسبة.");
  const advancingRef = useRef(false);
  const runTotalsRef = useRef(createGameRunTotals());
  const levelResetPendingRef = useRef(false);

  useEffect(() => {
    runTotalsRef.current = createGameRunTotals();
    setLevelIndex(0);
  }, [difficulty, restartToken]);
  const rules = getMosqueCleanupRules(difficulty, levelIndex);
  const meta = getKidsLevelMeta("mosque-cleanup", difficulty, levelIndex);
  const items = useMemo(() => seededShuffle(CLEANUP_ITEMS, "cleanup:" + meta.seed).slice(0, rules.itemCount), [meta.seed, rules.itemCount]);
  const complete = Object.keys(placed).length === items.length;
  const score = Math.max(0, Object.keys(placed).length * 170 - mistakes * rules.mistakePenalty);

  useEffect(() => { setSelected(null); setPlaced({}); setMistakes(0); setFeedback(meta.subtitleAr); levelResetPendingRef.current = true; advancingRef.current = false; }, [difficulty, levelIndex, meta.subtitleAr, restartToken]);

  useEffect(() => {
    const levelHud: WorldHud = { score: complete ? score + rules.completionBonus : score, collectibles: Object.keys(placed).length, distance: 0, combo: Math.max(0, Object.keys(placed).length - mistakes), level: levelIndex + 1, completed: complete && levelIndex === KIDS_LEVEL_COUNT - 1 };
    onHud(levelHud);
    if (levelResetPendingRef.current) {
      levelResetPendingRef.current = false;
      return;
    }
    if (!complete || advancingRef.current) return;
    advancingRef.current = true;
    onSound("success");
    const levelTotals = { score: levelHud.score, collectibles: levelHud.collectibles, combo: levelHud.combo };
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      runTotalsRef.current = accumulateGameLevel(runTotalsRef.current, levelTotals);
      setFeedback("اكتمل " + levelLabel(levelIndex) + ". توزيع جديد للعناصر جاهز.");
      window.setTimeout(() => setLevelIndex(value => value + 1), 650);
    } else {
      const totals = accumulateGameLevel(runTotalsRef.current, levelTotals);
      runTotalsRef.current = totals;
      const finalHud: WorldHud = { ...levelHud, score: totals.score, collectibles: totals.collectibles, combo: totals.bestCombo, completed: true };
      onHud(finalHud);
      setFeedback("أكملت جميع مستويات ترتيب المكان.");
      onResult(finalHud);
    }
  }, [complete, levelIndex, mistakes, onHud, onResult, onSound, placed, rules.completionBonus, score]);

  const place = (zone: CleanupZone) => {
    if (paused || !selected || placed[selected]) return;
    const item = items.find(value => value.id === selected);
    if (!item) return;
    if (item.target !== zone.id) { setMistakes(value => value + 1); onSound("miss"); setFeedback("هذا الغرض له ركن آخر."); return; }
    setPlaced(value => ({ ...value, [selected]: zone.id }));
    setSelected(null);
    onSound("collect");
    setFeedback(item.name + " وصل إلى مكانه الصحيح.");
  };

  const remaining = items.filter(item => !placed[item.id]);

  return (
    <KidsGameStage theme="mosque" ariaLabel="ترتيب المكان"><KidsGameWorld gameId="mosque-cleanup" />
      <KidsGameHeader eyebrow="MOSQUE CLEANUP" title="ترتيب المكان" description={meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={(Object.keys(placed).length / Math.max(1, items.length)) * 100} label={levelLabel(levelIndex)} /></div>} />
      <div className="px-4 sm:px-6"><KidsGameHud items={[
        { label: "النقاط", value: score, tone: "text-brand-gold" },
        { label: "مرتبة", value: Object.keys(placed).length + "/" + items.length, tone: "text-brand-emerald" },
        { label: "الأخطاء", value: mistakes, tone: "text-rose-100" },
        { label: "السلسلة", value: Math.max(0, Object.keys(placed).length - mistakes), tone: "text-violet-200" },
        { label: "المستوى", value: levelIndex + 1, tone: "text-sky-200" },
      ]} /></div>
      <div className="mx-4 mt-4 grid gap-4 sm:mx-6 lg:grid-cols-[1fr_.9fr]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#092027] p-4 sm:p-5"><MosqueBackdrop compact /><div className="relative z-10"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black tracking-[0.18em] text-brand-gold">العناصر</p><p className="mt-1 text-sm text-brand-cream/45">اختر عنصرًا ثم اختر ركنه.</p></div><KidCharacter variant="helper" state="help" size={66} /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {remaining.map(item => <button key={item.id} type="button" draggable={!paused} onDragStart={() => setSelected(item.id)} onClick={() => setSelected(item.id)} disabled={paused} className={["min-h-28 rounded-2xl border p-3 text-center transition", selected === item.id ? "border-brand-gold/70 bg-brand-gold/10 -translate-y-1" : "border-white/10 bg-black/20 hover:border-brand-gold/30"].join(" ")}><div className="text-3xl">{item.icon}</div><p className="mt-2 text-xs text-brand-cream/70">{item.name}</p></button>)}
        </div></div></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {CLEANUP_ZONES.map(zone => <button key={zone.id} type="button" onDrop={(event) => { event.preventDefault(); place(zone); }} onDragOver={(event) => event.preventDefault()} onClick={() => place(zone)} disabled={paused || !selected} className="group min-h-28 rounded-[1.7rem] border border-white/10 bg-black/20 p-4 text-right transition hover:border-brand-gold/40 disabled:opacity-50"><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-gold/15 bg-brand-gold/5 text-2xl">{zone.icon}</div><span className="text-xs text-brand-cream/40">{items.filter(item => placed[item.id] === zone.id).length} عناصر</span></div><h4 className="mt-3 font-black text-brand-cream">{zone.title}</h4><p className="mt-1 text-xs text-brand-cream/45">اضغط أو اسحب العنصر إلى هذا الركن</p></button>)}
        </div>
      </div>
      <GameToast tone={complete && levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type ColoringSheet = { id: string; title: string; subtitle: string };
const COLORING_SHEETS: ColoringSheet[] = [
  { id: "mosque-garden", title: "حديقة المسجد", subtitle: "قبة ونباتات وسماء هادئة" },
  { id: "crescent-night", title: "ليلة الهلال", subtitle: "هلال ونجوم وبيوت صغيرة" },
  { id: "geometry", title: "نجمة ذِكر", subtitle: "نقش هندسي مفتوح للتلوين" },
  { id: "lantern-street", title: "شارع الفوانيس", subtitle: "بوابة وفوانيس تضيء طريقًا هادئًا" },
  { id: "kite-meadow", title: "مرج الطائرات الورقية", subtitle: "سماء واسعة وطائرات ملونة وزهور" },
  { id: "starry-village", title: "قرية النجوم", subtitle: "بيوت صغيرة ونجوم وهلال لطيف" },
];
const COLOR_PALETTE = ["#f3c969","#5fd1a6","#8ab6e2","#d7a7e8","#e28a5a","#f7f1df","#7ed6c1","#9c86e8","#ffb4a2","#c6e377"];

function coloringSvg(sheetId: string, fill: (index: number) => string, paint: (index: number) => void) {
  const paintable = (index: number) => ({
    onClick: () => paint(index),
    onKeyDown: (event: ReactKeyboardEvent<SVGElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        paint(index);
      }
    },
    tabIndex: 0,
    role: "button" as const,
    "aria-label": "تلوين المنطقة " + (index + 1),
    className: "cursor-pointer focus-visible:stroke-white focus-visible:stroke-2",
  });
  if (sheetId === "geometry") return <svg viewBox="0 0 360 260" className="w-full" role="group" aria-label="لوحة هندسية"><rect x="25" y="25" width="310" height="210" rx="28" fill="#0a202a" stroke="#f3c969" strokeWidth="4" />{Array.from({ length: 8 }, (_, i) => <path key={i} d={"M180 44 L" + (205 + Math.cos(i * Math.PI / 4) * 85) + " " + (130 + Math.sin(i * Math.PI / 4) * 85) + " L180 216 L" + (155 - Math.cos(i * Math.PI / 4) * 85) + " " + (130 - Math.sin(i * Math.PI / 4) * 85) + " Z"} fill={fill(i)} stroke="#f3c969" strokeWidth="2" {...paintable(i)} />)}<circle cx="180" cy="130" r="30" fill={fill(8)} stroke="#5fd1a6" strokeWidth="3" {...paintable(8)} /><circle cx="180" cy="130" r="14" fill={fill(9)} stroke="#8ab6e2" strokeWidth="2" {...paintable(9)} /></svg>;
  if (sheetId === "crescent-night") return <svg viewBox="0 0 360 260" className="w-full" role="group" aria-label="لوحة الهلال"><rect x="25" y="25" width="310" height="210" rx="28" fill="#0b1b33" stroke="#f3c969" strokeWidth="4" /><path d="M215 53c-38 8-62 39-62 71 0 35 24 61 57 61 27 0 49-17 59-41-10 8-21 11-32 11-29 0-49-18-49-45 0-21 12-42 27-57z" fill={fill(0)} stroke="#f3c969" strokeWidth="3" {...paintable(0)} />{Array.from({ length: 7 }, (_, i) => <circle key={i} cx={72 + (i * 39) % 220} cy={60 + ((i * 31) % 120)} r={7 + (i % 2) * 3} fill={fill(i + 1)} stroke="#f7f1df" strokeWidth="1.5" {...paintable(i + 1)} />)}<path d="M75 188c22-34 45-34 67 0M82 188c12-18 28-18 40 0" fill={fill(8)} stroke="#5fd1a6" strokeWidth="4" {...paintable(8)} /><circle cx="305" cy="55" r="8" fill={fill(9)} {...paintable(9)} /></svg>;
  if (sheetId === "lantern-street") return (
    <svg viewBox="0 0 360 260" className="w-full" role="group" aria-label="لوحة شارع الفوانيس">
      <rect x="25" y="25" width="310" height="210" rx="28" fill="#0b1e2c" stroke="#f3c969" strokeWidth="4" />
      <circle cx="287" cy="56" r="18" fill={fill(9)} stroke="#f7f1df" strokeWidth="2" {...paintable(9)} />
      <path d="M90 214V112A90 90 0 0 1 270 112V214Z" fill={fill(0)} stroke="#d7a7e8" strokeWidth="3" {...paintable(0)} />
      <path d="M130 214V139A50 50 0 0 1 230 139V214Z" fill={fill(1)} stroke="#f3c969" strokeWidth="3" {...paintable(1)} />
      <path d="M70 75H91V93H70Z" fill={fill(2)} stroke="#f3c969" strokeWidth="2" {...paintable(2)} />
      <path d="M62 93H99L94 121H67Z" fill={fill(3)} stroke="#f3c969" strokeWidth="2" {...paintable(3)} />
      <path d="M168 54H192V72H168Z" fill={fill(4)} stroke="#f3c969" strokeWidth="2" {...paintable(4)} />
      <path d="M158 72H202L196 103H164Z" fill={fill(5)} stroke="#f3c969" strokeWidth="2" {...paintable(5)} />
      <path d="M269 75H290V93H269Z" fill={fill(6)} stroke="#f3c969" strokeWidth="2" {...paintable(6)} />
      <path d="M261 93H298L293 121H266Z" fill={fill(7)} stroke="#f3c969" strokeWidth="2" {...paintable(7)} />
      <path d="M45 214Q61 190 77 214Q92 181 108 214Z" fill={fill(8)} stroke="#5fd1a6" strokeWidth="2" {...paintable(8)} />
      <path d="M252 214Q268 190 284 214Q299 181 315 214Z" fill={fill(8)} stroke="#5fd1a6" strokeWidth="2" {...paintable(8)} />
      <path d="M43 235H317" stroke="#8ab6e2" strokeWidth="5" />
    </svg>
  );
  if (sheetId === "kite-meadow") return (
    <svg viewBox="0 0 360 260" className="w-full" role="group" aria-label="لوحة مرج الطائرات الورقية">
      <rect x="25" y="25" width="310" height="210" rx="28" fill="#102b43" stroke="#8ab6e2" strokeWidth="4" />
      <path d="M49 76Q61 54 80 69Q93 44 113 66Q137 63 134 84H49Z" fill={fill(0)} stroke="#f7f1df" strokeWidth="2" {...paintable(0)} />
      <path d="M225 68Q238 47 256 62Q276 42 290 66Q315 64 312 86H225Z" fill={fill(1)} stroke="#f7f1df" strokeWidth="2" {...paintable(1)} />
      <path d="M110 91L140 119L110 147L80 119Z" fill={fill(2)} stroke="#f3c969" strokeWidth="3" {...paintable(2)} />
      <path d="M110 147Q125 159 110 169Q96 178 115 188" fill="none" stroke={fill(3)} strokeWidth="4" strokeLinecap="round" {...paintable(3)} />
      <path d="M242 104L269 130L242 156L215 130Z" fill={fill(4)} stroke="#d7a7e8" strokeWidth="3" {...paintable(4)} />
      <path d="M242 156Q255 167 242 178Q230 188 249 198" fill="none" stroke={fill(5)} strokeWidth="4" strokeLinecap="round" {...paintable(5)} />
      <path d="M27 197Q101 165 177 201T333 196V232H27Z" fill={fill(6)} stroke="#5fd1a6" strokeWidth="2" {...paintable(6)} />
      <path d="M61 216Q78 197 95 216Q111 198 128 216Z" fill={fill(7)} stroke="#5fd1a6" strokeWidth="2" {...paintable(7)} />
      <circle cx="166" cy="210" r="9" fill={fill(8)} stroke="#f3c969" strokeWidth="2" {...paintable(8)} />
      <circle cx="198" cy="212" r="9" fill={fill(9)} stroke="#f3c969" strokeWidth="2" {...paintable(9)} />
    </svg>
  );
  if (sheetId === "starry-village") return (
    <svg viewBox="0 0 360 260" className="w-full" role="group" aria-label="لوحة قرية النجوم">
      <rect x="25" y="25" width="310" height="210" rx="28" fill="#171e3c" stroke="#f3c969" strokeWidth="4" />
      <path d="M45 158L88 111L131 158Z" fill={fill(0)} stroke="#f3c969" strokeWidth="2" {...paintable(0)} />
      <rect x="53" y="158" width="70" height="48" rx="4" fill={fill(1)} stroke="#8ab6e2" strokeWidth="2" {...paintable(1)} />
      <path d="M139 170L180 124L221 170Z" fill={fill(2)} stroke="#d7a7e8" strokeWidth="2" {...paintable(2)} />
      <rect x="149" y="170" width="62" height="36" rx="4" fill={fill(3)} stroke="#8ab6e2" strokeWidth="2" {...paintable(3)} />
      <path d="M226 160L267 116L308 160Z" fill={fill(4)} stroke="#5fd1a6" strokeWidth="2" {...paintable(4)} />
      <rect x="236" y="160" width="62" height="46" rx="4" fill={fill(5)} stroke="#8ab6e2" strokeWidth="2" {...paintable(5)} />
      <path d="M78 55L84 68L98 70L88 80L90 94L78 87L66 94L68 80L58 70L72 68Z" fill={fill(6)} stroke="#f7f1df" strokeWidth="1.5" {...paintable(6)} />
      <path d="M180 48L185 59L198 61L188 70L190 83L180 77L169 83L171 70L161 61L174 59Z" fill={fill(7)} stroke="#f7f1df" strokeWidth="1.5" {...paintable(7)} />
      <path d="M279 63L284 74L296 76L287 85L289 97L279 91L269 97L271 85L262 76L274 74Z" fill={fill(8)} stroke="#f7f1df" strokeWidth="1.5" {...paintable(8)} />
      <path d="M245 46A19 19 0 1 0 263 76A15 15 0 0 1 245 46Z" fill={fill(9)} stroke="#f3c969" strokeWidth="2" {...paintable(9)} />
    </svg>
  );
  return <svg viewBox="0 0 360 260" className="w-full" role="group" aria-label="لوحة حديقة المسجد"><rect x="25" y="25" width="310" height="210" rx="28" fill="#0a222a" stroke="#f3c969" strokeWidth="4" /><path d="M180 56c-22 0-40 18-40 40v45h80V96c0-22-18-40-40-40z" fill={fill(0)} stroke="#f3c969" strokeWidth="3" {...paintable(0)} /><rect x="119" y="141" width="122" height="45" rx="8" fill={fill(1)} stroke="#5fd1a6" strokeWidth="3" {...paintable(1)} />{Array.from({ length: 6 }, (_, i) => <circle key={i} cx={76 + i * 41} cy="174" r="15" fill={fill(i + 2)} stroke="#5fd1a6" strokeWidth="2" {...paintable(i + 2)} />)}<path d="M70 210h220" stroke="#8ab6e2" strokeWidth="8" /><circle cx="53" cy="62" r="9" fill={fill(8)} stroke="#f3c969" strokeWidth="2" {...paintable(8)} /><circle cx="310" cy="75" r="9" fill={fill(9)} stroke="#d7a7e8" strokeWidth="2" {...paintable(9)} /></svg>;
}

export function ZikrColoringGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: Props) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [fills, setFills] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ fills: string[]; paintedRegions: number[] }>>([]);
  const [roundPaintedRegions, setRoundPaintedRegions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("اختر لونًا ثم اضغط على أجزاء اللوحة.");
  const [saved, setSaved] = useState<Record<string, string[]>>({});
  const savedRef = useRef<Record<string, string[]>>({});
  const advancingRef = useRef(false);
  const runTotalsRef = useRef(createGameRunTotals());
  const levelResetPendingRef = useRef(false);
  const rules = getZikrColoringRules(difficulty, levelIndex);
  const meta = getKidsLevelMeta("zikr-coloring", difficulty, levelIndex);
  const sheetIndex = meta.pattern % COLORING_SHEETS.length;
  const current = COLORING_SHEETS[sheetIndex];

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("zikr-coloring-gallery-v3") || "{}");
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        const gallery: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(stored)) {
          if (Array.isArray(value) && value.every(color => typeof color === "string")) gallery[key] = value;
        }
        savedRef.current = gallery;
        setSaved(gallery);
      }
    } catch {
      savedRef.current = {};
      setSaved({});
    }
  }, []);

  useEffect(() => {
    runTotalsRef.current = createGameRunTotals();
    setLevelIndex(0);
  }, [difficulty, restartToken]);

  const storageKey = current.id + ":" + difficulty + ":" + levelIndex;
  const lastRestartRef = useRef(restartToken);
  useEffect(() => {
    const restarting = lastRestartRef.current !== restartToken && restartToken > 0;
    if (restarting) {
      lastRestartRef.current = restartToken;
      setCustomColors([]);
    }
    setFills(savedRef.current[storageKey] ?? []);
    setHistory([]);
    setRoundPaintedRegions([]);
    levelResetPendingRef.current = true;
    advancingRef.current = false;
    setFeedback(meta.subtitleAr);
  }, [meta.subtitleAr, restartToken, storageKey]);

  const savedSyncInitializedRef = useRef(false);
  useEffect(() => {
    if (!savedSyncInitializedRef.current) {
      savedSyncInitializedRef.current = true;
      return;
    }
    savedRef.current = saved;
  }, [saved]);

  const paint = (index: number) => {
    if (paused || complete) return;
    setHistory(previous => [...previous.slice(-19), { fills, paintedRegions: roundPaintedRegions }]);
    const next = [...fills]; next[index] = selectedColor; setFills(next);
    const nextGallery = { ...saved, [storageKey]: next };
    setSaved(nextGallery);
    try { localStorage.setItem("zikr-coloring-gallery-v3", JSON.stringify(nextGallery)); } catch {}
    setRoundPaintedRegions(previous => previous.includes(index) ? previous : [...previous, index]);
    onSound("collect");
    setFeedback("تم تلوين جزء جديد.");
  };

  const mixColor = () => {
    const base = selectedColor.replace("#", "");
    const gold = "f3c969";
    const rgb = (value: string) => parseInt(value, 16);
    const blend = (a: number, b: number) => Math.round((a + b) / 2).toString(16).padStart(2, "0");
    const mixed = "#" + blend(rgb(base.slice(0,2)), rgb(gold.slice(0,2))) + blend(rgb(base.slice(2,4)), rgb(gold.slice(2,4))) + blend(rgb(base.slice(4,6)), rgb(gold.slice(4,6)));
    setCustomColors(colors => colors.includes(mixed) ? colors : [...colors.slice(-3), mixed]);
    setSelectedColor(mixed);
    onSound("collect");
    setFeedback("صنعت لونًا جديدًا. جرّبه في اللوحة.");
  };

  const undo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setFills(last.fills);
    setRoundPaintedRegions(last.paintedRegions);
    setHistory(previous => previous.slice(0, -1));
    const nextGallery = { ...saved, [storageKey]: last.fills };
    setSaved(nextGallery);
    try { localStorage.setItem("zikr-coloring-gallery-v3", JSON.stringify(nextGallery)); } catch {}
    onSound("move");
  };

  const paintedThisLevel = roundPaintedRegions.length;
  const complete = paintedThisLevel >= rules.regionTarget;

  useEffect(() => {
    const levelHud: WorldHud = { score: paintedThisLevel * 115 + (complete ? rules.completionBonus : 0), collectibles: paintedThisLevel, distance: 0, combo: paintedThisLevel, level: levelIndex + 1, completed: complete && levelIndex === KIDS_LEVEL_COUNT - 1 };
    onHud(levelHud);
    if (levelResetPendingRef.current) {
      levelResetPendingRef.current = false;
      return;
    }
    if (!complete || advancingRef.current) return;
    advancingRef.current = true;
    onSound("success");
    const levelTotals = { score: levelHud.score, collectibles: levelHud.collectibles, combo: levelHud.combo };
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      runTotalsRef.current = accumulateGameLevel(runTotalsRef.current, levelTotals);
      setFeedback("اكتملت " + levelLabel(levelIndex) + ". لوحة مختلفة جاهزة.");
      window.setTimeout(() => setLevelIndex(value => value + 1), 650);
    } else {
      const totals = accumulateGameLevel(runTotalsRef.current, levelTotals);
      runTotalsRef.current = totals;
      const finalHud: WorldHud = { ...levelHud, score: totals.score, collectibles: totals.collectibles, combo: totals.bestCombo, completed: true };
      onHud(finalHud);
      setFeedback("أكملت جميع مستويات تلوين ذِكر.");
      onResult(finalHud);
    }
  }, [complete, levelIndex, onHud, onResult, onSound, paintedThisLevel, rules.completionBonus]);

  return (
    <KidsGameStage theme="garden" ariaLabel="تلوين ذِكر"><KidsGameWorld gameId="zikr-coloring" />
      <KidsGameHeader eyebrow="ZIKR COLORING" title="استوديو تلوين ذِكر" description={meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={(paintedThisLevel / rules.regionTarget) * 100} label={levelLabel(levelIndex)} /></div>} />
      <div className="mx-4 mt-4 grid gap-4 sm:mx-6 lg:grid-cols-[1fr_.72fr]">
        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4 sm:p-6">
          <div className="rounded-[1.7rem] border border-brand-gold/15 bg-[#071923] p-3 sm:p-5">{coloringSvg(current.id, index => fills[index] || "#14303a", paint)}</div>
          <div className="mt-4 flex flex-wrap gap-2">{[...COLOR_PALETTE, ...customColors].map((color, index) => <button key={color} type="button" onClick={() => setSelectedColor(color)} disabled={paused} aria-label={"اختيار اللون " + (index + 1)} className={"h-10 w-10 rounded-full border-2 transition " + (selectedColor === color ? "scale-110 border-white shadow-lg" : "border-white/15")} style={{ background: color }} />)}<button type="button" onClick={mixColor} disabled={paused} className="rounded-xl border border-brand-gold/30 px-4 py-2 text-xs font-black text-brand-gold">🎨 مزج</button><button type="button" onClick={undo} disabled={!history.length || paused} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-brand-cream/70">تراجع</button></div>
        </div>
        <div className="space-y-3">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-black tracking-[0.18em] text-brand-gold">المرحلة</p><h4 className="mt-1 text-xl font-black text-brand-cream">{current.title}</h4><p className="mt-1 text-xs text-brand-cream/45">{paintedThisLevel}/{rules.regionTarget} مناطق</p></div><KidCharacter variant="reader" state={complete ? "celebrate" : "idle"} size={70} /></div><div className="mt-4 grid grid-cols-2 gap-2">{Array.from({ length: 10 }, (_, i) => <StarToken key={i} size={27} active={i < paintedThisLevel} />)}</div></div>
          <div className="rounded-[2rem] border border-brand-emerald/15 bg-brand-emerald/[0.04] p-5"><p className="text-sm leading-7 text-brand-cream/65">كل مستوى يستخدم لوحة ونمط ألوان مختلفين. الأعمال محفوظة محليًا.</p></div>
        </div>
      </div>
      <GameToast tone={complete && levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

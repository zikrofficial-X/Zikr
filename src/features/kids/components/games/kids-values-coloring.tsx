"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";
import { GameToast, GardenBackdrop, KidsGameHeader, KidsGameHud, KidsGameStage, KidsProgress, KidCharacter, MosqueBackdrop, StarToken } from "@/features/kids/components/games/kids-game-kit";
import { getGoodDeedsRules } from "@/lib/games/good-deeds";
import { getMosqueCleanupRules } from "@/lib/games/mosque-cleanup";
import { getZikrColoringRules } from "@/lib/games/zikr-coloring";
import { getKidsLevelMeta, KIDS_LEVEL_COUNT } from "@/lib/games/kids-level-system";
import { seededShuffle } from "@/lib/games/gameplay-helpers";

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
  const [feedback, setFeedback] = useState("اختر مشهدًا وأكمله.");
  const advancingRef = useRef(false);
  const rules = getGoodDeedsRules(difficulty, levelIndex);
  const meta = getKidsLevelMeta("good-deeds", difficulty, levelIndex);
  const deeds = useMemo(() => seededShuffle(DEEDS, "deeds:" + meta.seed).slice(0, Math.min(DEEDS.length, rules.sceneCount)), [meta.seed, rules.sceneCount]);
  const complete = done.length === deeds.length;
  const score = done.length * rules.rewardPerScene;

  useEffect(() => { setDone([]); setActive(null); setFeedback(meta.subtitleAr); advancingRef.current = false; }, [difficulty, levelIndex, meta.subtitleAr, restartToken]);

  useEffect(() => {
    const hud: WorldHud = { score: complete ? score + rules.completionBonus : score, collectibles: done.length, distance: 0, combo: done.length, level: levelIndex + 1, completed: complete && levelIndex === KIDS_LEVEL_COUNT - 1 };
    onHud(hud);
    if (!complete || advancingRef.current) return;
    advancingRef.current = true;
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      setFeedback("اكتمل " + levelLabel(levelIndex) + ". مشاهد جديدة في الطريق.");
      onSound("success");
      window.setTimeout(() => setLevelIndex(value => value + 1), 650);
    } else {
      setFeedback("أكملت جميع مستويات أعمال الخير.");
      onSound("success");
      onResult(hud);
    }
  }, [complete, done.length, levelIndex, onHud, onResult, onSound, rules.completionBonus, score]);

  const finish = (id: string) => {
    if (paused || !active || done.includes(id)) return;
    setDone(value => [...value, id]);
    setActive(null);
    onSound("collect");
    setFeedback("اكتملت " + deeds.find(d => d.id === id)?.title + ".");
  };

  return (
    <KidsGameStage theme="garden" ariaLabel="أعمال الخير"><KidsGameWorld gameId="good-deeds" /><KidsGameWorld gameId="good-deeds" />
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
              {isActive && !doneAlready && <div className="mt-4 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.05] p-3"><div className="flex items-center gap-3"><KidCharacter variant="helper" state="help" size={58} /><p className="text-xs leading-6 text-brand-cream/55">نفّذ الحركة البسيطة ثم أنهِ المشهد.</p></div><button type="button" onClick={() => finish(deed.id)} className="mt-3 w-full rounded-xl bg-brand-gold px-4 py-3 text-sm font-black text-[#241c08]">إنهاء المشهد</button></div>}
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
  const rules = getMosqueCleanupRules(difficulty, levelIndex);
  const meta = getKidsLevelMeta("mosque-cleanup", difficulty, levelIndex);
  const items = useMemo(() => seededShuffle(CLEANUP_ITEMS, "cleanup:" + meta.seed).slice(0, rules.itemCount), [meta.seed, rules.itemCount]);
  const complete = Object.keys(placed).length === items.length;
  const score = Math.max(0, Object.keys(placed).length * 170 - mistakes * rules.mistakePenalty);

  useEffect(() => { setSelected(null); setPlaced({}); setMistakes(0); setFeedback(meta.subtitleAr); advancingRef.current = false; }, [difficulty, levelIndex, meta.subtitleAr, restartToken]);

  useEffect(() => {
    const hud: WorldHud = { score: complete ? score + rules.completionBonus : score, collectibles: Object.keys(placed).length, distance: 0, combo: Math.max(0, Object.keys(placed).length - mistakes), level: levelIndex + 1, completed: complete && levelIndex === KIDS_LEVEL_COUNT - 1 };
    onHud(hud);
    if (!complete || advancingRef.current) return;
    advancingRef.current = true;
    onSound("success");
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      setFeedback("اكتمل " + levelLabel(levelIndex) + ". توزيع جديد للعناصر جاهز.");
      window.setTimeout(() => setLevelIndex(value => value + 1), 650);
    } else {
      setFeedback("أكملت جميع مستويات ترتيب المكان.");
      onResult(hud);
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
    <KidsGameStage theme="mosque" ariaLabel="ترتيب المكان"><KidsGameWorld gameId="mosque-cleanup" /><KidsGameWorld gameId="mosque-cleanup" />
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
          {remaining.map(item => <button key={item.id} type="button" onClick={() => setSelected(item.id)} disabled={paused} className={["min-h-28 rounded-2xl border p-3 text-center transition", selected === item.id ? "border-brand-gold/70 bg-brand-gold/10 -translate-y-1" : "border-white/10 bg-black/20 hover:border-brand-gold/30"].join(" ")}><div className="text-3xl">{item.icon}</div><p className="mt-2 text-xs text-brand-cream/70">{item.name}</p></button>)}
        </div></div></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {CLEANUP_ZONES.map(zone => <button key={zone.id} type="button" onClick={() => place(zone)} disabled={paused || !selected} className="group min-h-28 rounded-[1.7rem] border border-white/10 bg-black/20 p-4 text-right transition hover:border-brand-gold/40 disabled:opacity-50"><div className="flex items-center justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-gold/15 bg-brand-gold/5 text-2xl">{zone.icon}</div><span className="text-xs text-brand-cream/40">{items.filter(item => placed[item.id] === zone.id).length} عناصر</span></div><h4 className="mt-3 font-black text-brand-cream">{zone.title}</h4><p className="mt-1 text-xs text-brand-cream/45">ضع العنصر المحدد هنا</p></button>)}
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
];
const COLOR_PALETTE = ["#f3c969","#5fd1a6","#8ab6e2","#d7a7e8","#e28a5a","#f7f1df","#7ed6c1","#9c86e8","#ffb4a2","#c6e377"];

function coloringSvg(sheetId: string, fill: (index: number) => string, paint: (index: number) => void) {
  if (sheetId === "geometry") return <svg viewBox="0 0 360 260" className="w-full" role="img" aria-label="لوحة هندسية"><rect x="25" y="25" width="310" height="210" rx="28" fill="#0a202a" stroke="#f3c969" strokeWidth="4" />{Array.from({ length: 8 }, (_, i) => <path key={i} d={"M180 44 L" + (205 + Math.cos(i * Math.PI / 4) * 85) + " " + (130 + Math.sin(i * Math.PI / 4) * 85) + " L180 216 L" + (155 - Math.cos(i * Math.PI / 4) * 85) + " " + (130 - Math.sin(i * Math.PI / 4) * 85) + " Z"} fill={fill(i)} stroke="#f3c969" strokeWidth="2" onClick={() => paint(i)} className="cursor-pointer" />)}<circle cx="180" cy="130" r="30" fill={fill(8)} stroke="#5fd1a6" strokeWidth="3" onClick={() => paint(8)} className="cursor-pointer" /><circle cx="180" cy="130" r="14" fill={fill(9)} stroke="#8ab6e2" strokeWidth="2" onClick={() => paint(9)} className="cursor-pointer" /></svg>;
  if (sheetId === "crescent-night") return <svg viewBox="0 0 360 260" className="w-full" role="img" aria-label="لوحة الهلال"><rect x="25" y="25" width="310" height="210" rx="28" fill="#0b1b33" stroke="#f3c969" strokeWidth="4" /><path d="M215 53c-38 8-62 39-62 71 0 35 24 61 57 61 27 0 49-17 59-41-10 8-21 11-32 11-29 0-49-18-49-45 0-21 12-42 27-57z" fill={fill(0)} stroke="#f3c969" strokeWidth="3" onClick={() => paint(0)} className="cursor-pointer" />{Array.from({ length: 7 }, (_, i) => <circle key={i} cx={72 + (i * 39) % 220} cy={60 + ((i * 31) % 120)} r={7 + (i % 2) * 3} fill={fill(i + 1)} stroke="#f7f1df" strokeWidth="1.5" onClick={() => paint(i + 1)} className="cursor-pointer" />)}<path d="M75 188c22-34 45-34 67 0M82 188c12-18 28-18 40 0" fill={fill(8)} stroke="#5fd1a6" strokeWidth="4" onClick={() => paint(8)} className="cursor-pointer" /><circle cx="305" cy="55" r="8" fill={fill(9)} onClick={() => paint(9)} className="cursor-pointer" /></svg>;
  return <svg viewBox="0 0 360 260" className="w-full" role="img" aria-label="لوحة حديقة المسجد"><rect x="25" y="25" width="310" height="210" rx="28" fill="#0a222a" stroke="#f3c969" strokeWidth="4" /><path d="M180 56c-22 0-40 18-40 40v45h80V96c0-22-18-40-40-40z" fill={fill(0)} stroke="#f3c969" strokeWidth="3" onClick={() => paint(0)} className="cursor-pointer" /><rect x="119" y="141" width="122" height="45" rx="8" fill={fill(1)} stroke="#5fd1a6" strokeWidth="3" onClick={() => paint(1)} className="cursor-pointer" />{Array.from({ length: 6 }, (_, i) => <circle key={i} cx={76 + i * 41} cy="174" r="15" fill={fill(i + 2)} stroke="#5fd1a6" strokeWidth="2" onClick={() => paint(i + 2)} className="cursor-pointer" />)}<path d="M70 210h220" stroke="#8ab6e2" strokeWidth="8" /><circle cx="53" cy="62" r="9" fill={fill(8)} stroke="#f3c969" strokeWidth="2" onClick={() => paint(8)} className="cursor-pointer" /><circle cx="310" cy="75" r="9" fill={fill(9)} stroke="#d7a7e8" strokeWidth="2" onClick={() => paint(9)} className="cursor-pointer" /></svg>;
}

export function ZikrColoringGame({ difficulty, restartToken, paused, onHud, onResult, onSound }: Props) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [fills, setFills] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [feedback, setFeedback] = useState("اختر لونًا ثم اضغط على أجزاء اللوحة.");
  const [saved, setSaved] = useState<Record<string, string[]>>({});
  const advancingRef = useRef(false);
  const rules = getZikrColoringRules(difficulty, levelIndex);
  const meta = getKidsLevelMeta("zikr-coloring", difficulty, levelIndex);
  const sheetIndex = meta.pattern % COLORING_SHEETS.length;
  const current = COLORING_SHEETS[sheetIndex];

  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem("zikr-coloring-gallery-v3") || "{}"); if (stored && typeof stored === "object") setSaved(stored); } catch {}
  }, []);

  const storageKey = current.id + ":" + difficulty + ":" + levelIndex;
  const lastRestartRef = useRef(restartToken);
  useEffect(() => {
    const restarting = lastRestartRef.current !== restartToken && restartToken > 0;
    if (restarting) {
      lastRestartRef.current = restartToken;
      setFills([]);
      setHistory([]);
      setSaved(value => {
        const next = { ...value, [storageKey]: [] };
        try { localStorage.setItem("zikr-coloring-gallery-v3", JSON.stringify(next)); } catch {}
        return next;
      });
      setFeedback(meta.subtitleAr);
      return;
    }
    setFills(saved[storageKey] ?? []);
    setHistory([]);
    setFeedback(meta.subtitleAr);
  }, [meta.subtitleAr, restartToken, saved, storageKey]);

  const paint = (index: number) => {
    if (paused) return;
    setHistory(previous => [...previous.slice(-19), fills]);
    const next = [...fills]; next[index] = selectedColor; setFills(next);
    setSaved(value => { const nextSaved = { ...value, [storageKey]: next }; localStorage.setItem("zikr-coloring-gallery-v3", JSON.stringify(nextSaved)); return nextSaved; });
    onSound("collect");
    setFeedback("تم تلوين جزء جديد.");
  };

  const undo = () => setHistory(previous => {
    const last = previous.at(-1); if (!last) return previous;
    setFills(last);
    setSaved(value => { const next = { ...value, [storageKey]: last }; localStorage.setItem("zikr-coloring-gallery-v3", JSON.stringify(next)); return next; });
    onSound("move");
    return previous.slice(0, -1);
  });

  const filled = fills.filter(Boolean).length;
  const complete = filled >= rules.regionTarget;

  useEffect(() => {
    const hud: WorldHud = { score: filled * 115 + (complete ? rules.completionBonus : 0), collectibles: filled, distance: 0, combo: filled, level: levelIndex + 1, completed: complete && levelIndex === KIDS_LEVEL_COUNT - 1 };
    onHud(hud);
    if (!complete || advancingRef.current) return;
    advancingRef.current = true;
    onSound("success");
    if (levelIndex + 1 < KIDS_LEVEL_COUNT) {
      setFeedback("اكتملت " + levelLabel(levelIndex) + ". لوحة مختلفة جاهزة.");
      window.setTimeout(() => setLevelIndex(value => value + 1), 650);
    } else {
      setFeedback("أكملت جميع مستويات تلوين ذِكر.");
      onResult(hud);
    }
  }, [complete, filled, levelIndex, onHud, onResult, onSound, rules.completionBonus]);

  return (
    <KidsGameStage theme="garden" ariaLabel="تلوين ذِكر"><KidsGameWorld gameId="zikr-coloring" /><KidsGameWorld gameId="zikr-coloring" />
      <KidsGameHeader eyebrow="ZIKR COLORING" title="استوديو تلوين ذِكر" description={meta.subtitleAr} right={<div className="hidden w-52 sm:block"><KidsProgress value={(filled / rules.regionTarget) * 100} label={levelLabel(levelIndex)} /></div>} />
      <div className="mx-4 mt-4 grid gap-4 sm:mx-6 lg:grid-cols-[1fr_.72fr]">
        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4 sm:p-6">
          <div className="rounded-[1.7rem] border border-brand-gold/15 bg-[#071923] p-3 sm:p-5">{coloringSvg(current.id, index => fills[index] || "#14303a", paint)}</div>
          <div className="mt-4 flex flex-wrap gap-2">{COLOR_PALETTE.map((color, index) => <button key={color} type="button" onClick={() => setSelectedColor(color)} disabled={paused} aria-label={"اختيار اللون " + (index + 1)} className={"h-10 w-10 rounded-full border-2 transition " + (selectedColor === color ? "scale-110 border-white shadow-lg" : "border-white/15")} style={{ background: color }} />)}<button type="button" onClick={undo} disabled={!history.length || paused} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-brand-cream/70">تراجع</button></div>
        </div>
        <div className="space-y-3">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-black tracking-[0.18em] text-brand-gold">المرحلة</p><h4 className="mt-1 text-xl font-black text-brand-cream">{current.title}</h4><p className="mt-1 text-xs text-brand-cream/45">{filled}/{rules.regionTarget} مناطق</p></div><KidCharacter variant="reader" state={complete ? "celebrate" : "idle"} size={70} /></div><div className="mt-4 grid grid-cols-2 gap-2">{Array.from({ length: 10 }, (_, i) => <StarToken key={i} size={27} active={i < filled} />)}</div></div>
          <div className="rounded-[2rem] border border-brand-emerald/15 bg-brand-emerald/[0.04] p-5"><p className="text-sm leading-7 text-brand-cream/65">كل مستوى يستخدم لوحة ونمط ألوان مختلفين. الأعمال محفوظة محليًا.</p></div>
        </div>
      </div>
      <GameToast tone={complete && levelIndex === KIDS_LEVEL_COUNT - 1 ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

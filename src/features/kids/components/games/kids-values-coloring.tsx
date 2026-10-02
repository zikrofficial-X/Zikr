"use client";

import { useEffect, useState } from "react";
import type { GameDifficulty } from "@/lib/games/registry";
import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { WorldHud } from "@/features/kids/components/games/world-game-stage";
import {
  GameToast,
  GardenBackdrop,
  KidsGameHeader,
  KidsGameHud,
  KidsGameStage,
  KidsProgress,
  KidCharacter,
  MosqueBackdrop,
  StarToken,
} from "@/features/kids/components/games/kids-game-kit";

type Props = {
  difficulty: GameDifficulty;
  restartToken: number;
  paused: boolean;
  onHud: (hud: WorldHud) => void;
  onResult: (result: WorldHud) => void;
  onSound: (event: GameSoundEvent) => void;
};

type Deed = {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

const DEEDS: Deed[] = [
  { id: "share", title: "صندوق المشاركة", description: "اختر شيئًا داخل العالم وشاركه مع الشخصية الأخرى.", icon: "🎁", color: "#f3c969" },
  { id: "welcome", title: "بوابة الترحيب", description: "رحّب بالضيف الافتراضي ثم افتح الباب.", icon: "🤝", color: "#5fd1a6" },
  { id: "plant", title: "حديقة صغيرة", description: "اسقِ نبتة العالم الخيالي لتزهر.", icon: "🌱", color: "#8ab6e2" },
  { id: "book", title: "رف المعرفة", description: "ضع الكتاب في الرف المناسب.", icon: "📘", color: "#d7a7e8" },
  { id: "lantern", title: "فانوس الطريق", description: "أشعل الفانوس ليضيء الطريق الهادئ.", icon: "🏮", color: "#f3c969" },
  { id: "help", title: "المساعدة", description: "ساعد الشخصية على حمل الصندوق داخل المشهد.", icon: "🧺", color: "#5fd1a6" },
];

const difficultyCount: Record<GameDifficulty, number> = { easy: 3, normal: 5, hard: 6 };

export function GoodDeedsGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const count = difficultyCount[difficulty];
  const deeds = DEEDS.slice(0, count);
  const [done, setDone] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("هذه مهام داخل عالم اللعبة فقط. اختر مشهدًا وأكمله.");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setDone([]);
    setActive(null);
    setFeedback("هذه مهام داخل عالم اللعبة فقط. اختر مشهدًا وأكمله.");
  }, [difficulty, restartToken]);

  const score = done.length * 220;
  const combo = done.length;
  const completed = done.length === deeds.length;

  useEffect(() => {
    const hud: WorldHud = {
      score: completed ? score + 500 : score,
      collectibles: done.length,
      distance: 0,
      combo,
      level: difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1,
      completed,
    };
    onHud(hud);
    if (completed) {
      onSound("success");
      setFeedback("اكتملت مجموعة الخير داخل عالم ذِكر.");
      onResult(hud);
    }
  }, [combo, completed, difficulty, done.length, onHud, onResult, onSound, score]);

  const finishDeed = (id: string) => {
    if (paused || done.includes(id) || !active) return;
    setDone(value => [...value, id]);
    setActive(null);
    onSound("collect");
    setFeedback("اكتملت " + deeds.find(deed => deed.id === id)?.title + ". اختر مشهدًا جديدًا.");
  };

  return (
    <KidsGameStage theme="garden" ariaLabel="أعمال الخير">
      <KidsGameHeader
        eyebrow="GOOD DEEDS"
        title="مغامرة أعمال الخير"
        description="بدل قائمة مهام ثابتة، كل عمل أصبح مشهدًا تفاعليًا صغيرًا داخل عالم اللعبة."
        right={<div className="hidden w-52 sm:block"><KidsProgress value={(done.length / deeds.length) * 100} label="مجموعة الخير" /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: completed ? score + 500 : score, tone: "text-brand-gold" },
            { label: "المشاهد", value: done.length + "/" + deeds.length, tone: "text-brand-emerald" },
            { label: "السلسلة", value: combo, tone: "text-violet-200" },
            { label: "الصعوبة", value: difficulty, tone: "text-sky-200" },
            { label: "الحالة", value: completed ? "مكتملة" : "تجول", tone: "text-amber-200" },
          ]}
        />
      </div>

      <div className="relative mx-4 mt-4 min-h-[500px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#09272b] sm:mx-6">
        <GardenBackdrop />
        <MosqueBackdrop compact />
        <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_30%_25%,#f3c96918,transparent_22%),radial-gradient(circle_at_75%_20%,#5fd1a618,transparent_24%)]" />

        <div className="relative z-20 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6">
          {deeds.map(deed => {
            const doneAlready = done.includes(deed.id);
            const isActive = active === deed.id;
            return (
              <button
                key={deed.id}
                type="button"
                disabled={paused || doneAlready}
                onClick={() => setActive(isActive ? null : deed.id)}
                className={[
                  "group rounded-[1.7rem] border p-4 text-right transition",
                  doneAlready
                    ? "border-brand-emerald/30 bg-brand-emerald/10 opacity-65"
                    : isActive
                      ? "border-brand-gold/60 bg-brand-gold/10 -translate-y-1"
                      : "border-white/10 bg-black/20 hover:-translate-y-1 hover:border-brand-cream/20",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-2xl border text-2xl"
                    style={{ borderColor: deed.color + "55", background: deed.color + "15" }}
                  >
                    {doneAlready ? "✓" : deed.icon}
                  </span>
                  <span className="text-xs text-brand-cream/35">مشهد {deeds.indexOf(deed) + 1}</span>
                </div>
                <h4 className="mt-4 text-lg font-black text-brand-cream">{deed.title}</h4>
                <p className="mt-2 text-sm leading-7 text-brand-cream/60">{deed.description}</p>
                {isActive && !doneAlready && (
                  <div className="mt-4 rounded-2xl border border-brand-gold/15 bg-brand-gold/[0.05] p-3">
                    <div className="flex items-center gap-3">
                      <KidCharacter variant="helper" state="help" size={58} />
                      <div>
                        <p className="text-xs font-black text-brand-gold">المشهد جاهز</p>
                        <p className="mt-1 text-xs leading-6 text-brand-cream/55">
                          اضغط إنهاء المشهد لإكمال هذا الجزء من الرحلة.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        finishDeed(deed.id);
                      }}
                      className="mt-3 w-full rounded-xl bg-brand-gold px-4 py-3 text-sm font-black text-[#241c08]"
                    >
                      إنهاء المشهد
                    </button>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {completed && (
          <div className="relative z-30 mx-4 mb-4 rounded-[1.7rem] border border-brand-gold/20 bg-[#06131b]/85 p-5 text-center backdrop-blur-md sm:mx-6">
            <KidCharacter variant="helper" state="celebrate" size={88} />
            <h4 className="mt-2 text-2xl font-black text-brand-gold">مجموعة الخير اكتملت</h4>
            <p className="mt-2 text-sm leading-7 text-brand-cream/60">
              أنهيت كل المشاهد المتاحة في مستوى {difficulty}.
            </p>
          </div>
        )}
      </div>
      <GameToast tone={completed ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type CleanupItem = {
  id: string;
  name: string;
  icon: string;
  target: "books" | "lights" | "soft" | "green";
};

type CleanupZone = {
  id: CleanupItem["target"];
  title: string;
  icon: string;
  tone: string;
};

const CLEANUP_ITEMS: CleanupItem[] = [
  { id: "book1", name: "كتاب", icon: "📘", target: "books" },
  { id: "book2", name: "دفتر", icon: "📓", target: "books" },
  { id: "lamp1", name: "مصباح", icon: "🪔", target: "lights" },
  { id: "lamp2", name: "فانوس", icon: "🏮", target: "lights" },
  { id: "pillow", name: "وسادة", icon: "🟣", target: "soft" },
  { id: "ball", name: "كرة", icon: "⚽", target: "soft" },
  { id: "plant", name: "نبتة", icon: "🌿", target: "green" },
  { id: "plant2", name: "شتلة", icon: "🌱", target: "green" },
  { id: "book3", name: "قصة", icon: "📗", target: "books" },
  { id: "lamp3", name: "ضوء", icon: "💡", target: "lights" },
];

const CLEANUP_ZONES: CleanupZone[] = [
  { id: "books", title: "رف الكتب", icon: "📚", tone: "violet" },
  { id: "lights", title: "ركن الإضاءة", icon: "💡", tone: "gold" },
  { id: "soft", title: "سلة اللعب الهادئ", icon: "🧺", tone: "sky" },
  { id: "green", title: "ركن النباتات", icon: "🌿", tone: "emerald" },
];

export function MosqueCleanupGame({
  difficulty,
  restartToken,
  paused,
  onHud,
  onResult,
  onSound,
}: Props) {
  const count = difficulty === "easy" ? 5 : difficulty === "normal" ? 8 : 10;
  const items = CLEANUP_ITEMS.slice(0, count);
  const [selected, setSelected] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState("اختر غرضًا ثم اضغط منطقة الترتيب المناسبة.");
  const score = Object.keys(placed).length * 170 - mistakes * (difficulty === "hard" ? 35 : 15);
  const complete = Object.keys(placed).length === items.length;

  useEffect(() => {
    setSelected(null);
    setPlaced({});
    setMistakes(0);
    setFeedback("اختر غرضًا ثم اضغط منطقة الترتيب المناسبة.");
  }, [difficulty, restartToken]);

  useEffect(() => {
    const hud: WorldHud = {
      score: Math.max(0, complete ? score + 500 : score),
      collectibles: Object.keys(placed).length,
      distance: 0,
      combo: Math.max(0, Object.keys(placed).length - mistakes),
      level: difficulty === "hard" ? 3 : difficulty === "normal" ? 2 : 1,
      completed: complete,
    };
    onHud(hud);
    if (complete) {
      onSound("success");
      setFeedback("المكان مرتب بالكامل.");
      onResult(hud);
    }
  }, [complete, difficulty, mistakes, onHud, onResult, onSound, placed, score]);

  const place = (zone: CleanupZone) => {
    if (paused || !selected || placed[selected]) return;
    const item = items.find(value => value.id === selected);
    if (!item) return;

    if (item.target !== zone.id) {
      setMistakes(value => value + 1);
      onSound("miss");
      setFeedback("المكان قريب، لكن هذا الغرض له ركن آخر.");
      return;
    }

    setPlaced(value => ({ ...value, [selected]: zone.id }));
    setSelected(null);
    onSound("collect");
    setFeedback(item.name + " وصل إلى مكانه الصحيح.");
  };

  const remaining = items.filter(item => !placed[item.id]);

  return (
    <KidsGameStage theme="mosque" ariaLabel="ترتيب المكان">
      <KidsGameHeader
        eyebrow="MOSQUE CLEANUP"
        title="ترتيب المكان"
        description="لعبة تصنيف حقيقية: اختر العنصر ثم ضعه في المنطقة المناسبة بدل مجرد الضغط على قائمة."
        right={<div className="hidden w-52 sm:block"><KidsProgress value={(Object.keys(placed).length / items.length) * 100} label="نسبة الترتيب" /></div>}
      />
      <div className="px-4 sm:px-6">
        <KidsGameHud
          items={[
            { label: "النقاط", value: Math.max(0, score), tone: "text-brand-gold" },
            { label: "مرتبة", value: Object.keys(placed).length + "/" + items.length, tone: "text-brand-emerald" },
            { label: "الأخطاء", value: mistakes, tone: "text-rose-100" },
            { label: "السلسلة", value: Math.max(0, Object.keys(placed).length - mistakes), tone: "text-violet-200" },
            { label: "المستوى", value: difficulty, tone: "text-sky-200" },
          ]}
        />
      </div>

      <div className="mx-4 mt-4 grid gap-4 sm:mx-6 lg:grid-cols-[1fr_.9fr]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#092027] p-4 sm:p-5">
          <MosqueBackdrop compact />
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-brand-gold">العناصر</p>
                <p className="mt-1 text-sm text-brand-cream/45">اضغط عنصرًا واحدًا ثم اختر ركنه.</p>
              </div>
              <KidCharacter variant="helper" state="help" size={66} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {remaining.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item.id)}
                  disabled={paused}
                  className={[
                    "min-h-28 rounded-2xl border p-3 text-center transition",
                    selected === item.id
                      ? "border-brand-gold/70 bg-brand-gold/10 -translate-y-1"
                      : "border-white/10 bg-black/20 hover:border-brand-gold/30",
                  ].join(" ")}
                >
                  <div className="text-3xl">{item.icon}</div>
                  <p className="mt-2 text-xs text-brand-cream/70">{item.name}</p>
                </button>
              ))}
              {!remaining.length && (
                <div className="col-span-full rounded-2xl border border-brand-emerald/25 bg-brand-emerald/10 p-8 text-center">
                  <KidCharacter variant="helper" state="celebrate" size={76} />
                  <p className="mt-2 font-black text-brand-emerald">لا يوجد شيء يحتاج إلى ترتيب.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {CLEANUP_ZONES.map(zone => {
            const zoneItems = items.filter(item => placed[item.id] === zone.id).length;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => place(zone)}
                disabled={paused || !selected}
                className="group min-h-28 rounded-[1.7rem] border border-white/10 bg-black/20 p-4 text-right transition hover:border-brand-gold/40 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-gold/15 bg-brand-gold/5 text-2xl">{zone.icon}</div>
                  <span className="text-xs text-brand-cream/40">{zoneItems} عناصر</span>
                </div>
                <h4 className="mt-3 font-black text-brand-cream">{zone.title}</h4>
                <p className="mt-1 text-xs text-brand-cream/45">ضع العنصر المحدد هنا</p>
              </button>
            );
          })}
        </div>
      </div>
      <GameToast tone={complete ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

type ColoringSheet = {
  id: string;
  title: string;
  subtitle: string;
};

const COLORING_SHEETS: ColoringSheet[] = [
  { id: "mosque-garden", title: "حديقة المسجد", subtitle: "قبة ونباتات وسماء هادئة" },
  { id: "crescent-night", title: "ليلة الهلال", subtitle: "هلال ونجوم وبيوت صغيرة" },
  { id: "geometry", title: "نجمة ذِكر", subtitle: "نقش هندسي بسيط ومفتوح للتلوين" },
];

const COLOR_PALETTE = [
  "#f3c969",
  "#5fd1a6",
  "#8ab6e2",
  "#d7a7e8",
  "#e28a5a",
  "#f7f1df",
  "#7ed6c1",
  "#9c86e8",
];

function coloringSvg(sheetId: string, fill: (index: number) => string, paint: (index: number) => void) {
  if (sheetId === "geometry") {
    return (
      <svg viewBox="0 0 360 260" className="w-full" role="img" aria-label="لوحة هندسية">
        <rect x="25" y="25" width="310" height="210" rx="28" fill="#0a202a" stroke="#f3c969" strokeWidth="4" />
        {Array.from({ length: 8 }, (_, index) => (
          <path
            key={index}
            d={
              "M180 44 L" +
              String(205 + Math.cos(index * Math.PI / 4) * 85) +
              " " +
              String(130 + Math.sin(index * Math.PI / 4) * 85) +
              " L180 216 L" +
              String(155 - Math.cos(index * Math.PI / 4) * 85) +
              " " +
              String(130 - Math.sin(index * Math.PI / 4) * 85) +
              " Z"
            }
            fill={fill(index)}
            stroke="#f3c969"
            strokeWidth="2"
            onClick={() => paint(index)}
            className="cursor-pointer"
          />
        ))}
        <circle cx="180" cy="130" r="30" fill={fill(8)} stroke="#5fd1a6" strokeWidth="3" onClick={() => paint(8)} className="cursor-pointer" />
      </svg>
    );
  }

  if (sheetId === "crescent-night") {
    return (
      <svg viewBox="0 0 360 260" className="w-full" role="img" aria-label="لوحة الهلال">
        <rect x="25" y="25" width="310" height="210" rx="28" fill="#0b1b33" stroke="#f3c969" strokeWidth="4" />
        <path d="M215 53c-38 8-62 39-62 71 0 35 24 61 57 61 27 0 49-17 59-41-10 8-21 11-32 11-29 0-49-18-49-45 0-21 12-42 27-57z" fill={fill(0)} stroke="#f3c969" strokeWidth="3" onClick={() => paint(0)} className="cursor-pointer" />
        {Array.from({ length: 7 }, (_, index) => {
          const x = 72 + (index * 39) % 220;
          const y = 60 + ((index * 31) % 120);
          return <circle key={index} cx={x} cy={y} r={7 + index % 2 * 3} fill={fill(index + 1)} stroke="#f7f1df" strokeWidth="1.5" onClick={() => paint(index + 1)} className="cursor-pointer" />;
        })}
        <path d="M75 188c22-34 45-34 67 0M82 188c12-18 28-18 40 0" fill={fill(9)} stroke="#5fd1a6" strokeWidth="4" onClick={() => paint(9)} className="cursor-pointer" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 260" className="w-full" role="img" aria-label="لوحة حديقة المسجد">
      <rect x="25" y="25" width="310" height="210" rx="28" fill="#0a222a" stroke="#f3c969" strokeWidth="4" />
      <path d="M180 56c-22 0-40 18-40 40v45h80V96c0-22-18-40-40-40z" fill={fill(0)} stroke="#f3c969" strokeWidth="3" onClick={() => paint(0)} className="cursor-pointer" />
      <rect x="119" y="141" width="122" height="45" rx="8" fill={fill(1)} stroke="#5fd1a6" strokeWidth="3" onClick={() => paint(1)} className="cursor-pointer" />
      <path d="M153 141v-30M207 141v-30" stroke="#f3c969" strokeWidth="7" />
      {Array.from({ length: 6 }, (_, index) => {
        const x = index < 3 ? 76 + index * 25 : 255 + (index - 3) * 25;
        return <circle key={index} cx={x} cy={174} r="15" fill={fill(index + 2)} stroke="#5fd1a6" strokeWidth="2" onClick={() => paint(index + 2)} className="cursor-pointer" />;
      })}
      <path d="M70 210h220" stroke="#8ab6e2" strokeWidth="8" />
      <circle cx="53" cy="62" r="9" fill={fill(8)} stroke="#f3c969" strokeWidth="2" onClick={() => paint(8)} className="cursor-pointer" />
      <circle cx="310" cy="75" r="9" fill={fill(9)} stroke="#d7a7e8" strokeWidth="2" onClick={() => paint(9)} className="cursor-pointer" />
      <path d="M299 50v-12M293 44h12" stroke="#f3c969" strokeWidth="3" />
    </svg>
  );
}

export function ZikrColoringGame({
  restartToken,
  onHud,
  onResult,
  onSound,
}: Props) {
  const [sheetIndex, setSheetIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [fills, setFills] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [saved, setSaved] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState("اختر لونًا ثم اضغط على أجزاء اللوحة.");
  const current = COLORING_SHEETS[sheetIndex];

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem("zikr-coloring-gallery-v2") || "{}");
      if (stored && typeof stored === "object") setSaved(stored);
    } catch {
      // Ignore corrupt local coloring data.
    }
  }, []);

  useEffect(() => {
    setFills(saved[current.id] ?? []);
    setHistory([]);
  }, [current.id, saved]);

  useEffect(() => {
    if (restartToken <= 0) return;
    setFills([]);
    setHistory([]);
    setSaved(value => {
      const next = { ...value, [current.id]: [] };
      localStorage.setItem("zikr-coloring-gallery-v2", JSON.stringify(next));
      return next;
    });
  }, [current.id, restartToken]);

  const paint = (index: number) => {
    setHistory(previous => [...previous.slice(-19), fills]);
    const next = [...fills];
    next[index] = selectedColor;
    setFills(next);
    setSaved(value => {
      const nextSaved = { ...value, [current.id]: next };
      localStorage.setItem("zikr-coloring-gallery-v2", JSON.stringify(nextSaved));
      return nextSaved;
    });
    onSound("collect");
    setFeedback("لون جديد أُضيف للوحة.");
  };

  const undo = () => {
    setHistory(previous => {
      const last = previous.at(-1);
      if (!last) return previous;
      setFills(last);
      setSaved(value => {
        const next = { ...value, [current.id]: last };
        localStorage.setItem("zikr-coloring-gallery-v2", JSON.stringify(next));
        return next;
      });
      onSound("move");
      return previous.slice(0, -1);
    });
  };

  const filled = fills.filter(Boolean).length;
  const complete = filled >= 8;
  const score = filled * 110;

  useEffect(() => {
    const hud: WorldHud = {
      score: complete ? score + 300 : score,
      collectibles: filled,
      distance: 0,
      combo: filled,
      level: sheetIndex + 1,
      completed: complete,
    };
    onHud(hud);
    if (complete) onResult(hud);
  }, [complete, filled, onHud, onResult, score, sheetIndex]);

  return (
    <KidsGameStage theme="garden" ariaLabel="تلوين ذِكر">
      <KidsGameHeader
        eyebrow="ZIKR COLORING"
        title="استوديو تلوين ذِكر"
        description="ثلاث لوحات أصلية قابلة للتلوين، مع معرض محلي يحفظ أعمالك على الجهاز."
        right={<div className="hidden w-52 sm:block"><KidsProgress value={(filled / 8) * 100} label="اكتملت اللوحة" /></div>}
      />
      <div className="mx-4 mt-4 grid gap-4 sm:mx-6 lg:grid-cols-[1fr_.72fr]">
        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-4 sm:p-6">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {COLORING_SHEETS.map((sheet, index) => (
              <button
                key={sheet.id}
                type="button"
                onClick={() => setSheetIndex(index)}
                className={
                  "shrink-0 rounded-2xl border px-4 py-3 text-right text-sm " +
                  (index === sheetIndex ? "border-brand-gold/60 bg-brand-gold/10 text-brand-gold" : "border-white/10 bg-white/[0.03] text-brand-cream/60")
                }
              >
                <strong className="block">{sheet.title}</strong>
                <span className="text-xs opacity-60">{sheet.subtitle}</span>
              </button>
            ))}
          </div>

          <div className="rounded-[1.7rem] border border-brand-gold/15 bg-[#071923] p-3 sm:p-5">
            {coloringSvg(current.id, index => fills[index] || "#14303a", paint)}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {COLOR_PALETTE.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                aria-label={"اختيار اللون " + color}
                className={
                  "h-10 w-10 rounded-full border-2 transition " +
                  (selectedColor === color ? "scale-110 border-white shadow-lg" : "border-white/15")
                }
                style={{ background: color }}
              />
            ))}
            <button
              type="button"
              onClick={undo}
              disabled={!history.length}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-brand-cream/70 disabled:opacity-30"
            >
              تراجع
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black tracking-[0.18em] text-brand-gold">معرضي</p>
                <h4 className="mt-1 text-xl font-black text-brand-cream">{filled}/8 مناطق ملونة</h4>
              </div>
              <KidCharacter variant="reader" state={complete ? "celebrate" : "idle"} size={70} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {COLORING_SHEETS.map(sheet => {
                const count = (saved[sheet.id] ?? []).filter(Boolean).length;
                return (
                  <button
                    key={sheet.id}
                    type="button"
                    onClick={() => setSheetIndex(COLORING_SHEETS.indexOf(sheet))}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center"
                  >
                    <StarToken size={28} active={count >= 8} />
                    <span className="mt-2 block text-[11px] text-brand-cream/55">{count}/8</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-emerald/15 bg-brand-emerald/[0.04] p-5">
            <p className="text-sm leading-7 text-brand-cream/65">
              اللوحات محفوظة محليًا على هذا الجهاز. لا تحتاج إلى حساب، ولا تُرسل رسوماتك إلى الخادم.
            </p>
          </div>
        </div>
      </div>
      <GameToast tone={complete ? "emerald" : "gold"}>{feedback}</GameToast>
    </KidsGameStage>
  );
}

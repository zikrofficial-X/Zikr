"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Progress = { xp: number; level: number; total_games: number; total_score: number; total_collectibles: number };
type GameProgress = { gameId: string; bestScore: number; playCount: number };
const CONTENT_OPTIONS = [
  { id: "games", label: "الألعاب التعليمية", description: "ألعاب آمنة بلا مقارنة عامة." },
  { id: "stories", label: "القصص والفيديوهات", description: "قصص خيالية تربوية ومقاطع مناسبة للعمر." },
  { id: "memorization", label: "الحفظ والتسميع", description: "خطة قصيرة قابلة للتعديل مع مراجعة." },
] as const;
const WEEK_PLAN = ["لعبة حروف أو ذاكرة — 10 دقائق", "قراءة قصة قصيرة مع سؤال واحد", "مراجعة دعاء أو سورة محفوظة", "نشاط خير صغير مع الأسرة"];

export default function ParentDashboardPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [games, setGames] = useState<GameProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAge, setSelectedAge] = useState("6-8");
  const [dailyMinutes, setDailyMinutes] = useState(15);
  const [allowed, setAllowed] = useState<Record<string, boolean>>({ games: true, stories: true, memorization: true });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("zikr-parent-settings") || "{}") as { selectedAge?: string; dailyMinutes?: number; allowed?: Record<string, boolean> };
      if (saved.selectedAge) setSelectedAge(saved.selectedAge); if (saved.dailyMinutes) setDailyMinutes(saved.dailyMinutes); if (saved.allowed) setAllowed(value => ({ ...value, ...saved.allowed }));
    } catch { /* use safe defaults */ }
    Promise.all([fetch("/api/kids/games/progress", { credentials: "include" }), fetch("/api/kids/games/achievements", { credentials: "include" })]).then(async ([response]) => {
      if (response.ok) { const data = await response.json() as { player: Progress; games: GameProgress[] }; setProgress(data.player); setGames(data.games); }
    }).catch(() => undefined).finally(() => setLoading(false));
  }, []);
  const save = () => { localStorage.setItem("zikr-parent-settings", JSON.stringify({ selectedAge, dailyMinutes, allowed })); };
  const totalPlays = useMemo(() => games.reduce((sum, game) => sum + game.playCount, 0), [games]);
  return <Container className="space-y-6 py-8 sm:py-12" dir="rtl">
    <header className="space-y-3"><Link href="/kids" className="text-sm text-brand-gold underline underline-offset-4">العودة إلى عالم الأطفال</Link><p className="text-xs font-black tracking-[.2em] text-brand-emerald">للوالدين فقط</p><h1 className="text-3xl font-black text-brand-gold sm:text-5xl">لوحة متابعة الطفل</h1><p className="max-w-3xl leading-8 text-brand-cream/70">مساحة هادئة لمتابعة التقدم وتنظيم وقت التعلم. لا توجد لوحة ترتيب عامة ولا مقارنة بين الأطفال.</p></header>
    <section className="grid gap-3 sm:grid-cols-4"><Stat label="المستوى" value={progress?.level ?? 1} /><Stat label="XP" value={progress?.xp ?? 0} /><Stat label="الجولات" value={progress?.total_games ?? totalPlays} /><Stat label="النجوم" value={progress?.total_collectibles ?? 0} /></section>
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <Card className="space-y-5 border-brand-gold/25 bg-brand-gold/[.04] p-5 sm:p-6"><div><h2 className="text-2xl font-black text-brand-gold">خطة هذا الأسبوع</h2><p className="mt-2 text-sm leading-7 text-brand-cream/60">اقتراحات قصيرة؛ اختر ما يناسب وقت أسرتكم ولا تجعل الخطة ضغطًا على الطفل.</p></div><ol className="space-y-3">{WEEK_PLAN.map((item, index) => <li key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-emerald/20 font-bold text-brand-emerald">{index + 1}</span><span className="text-sm text-brand-cream/80">{item}</span></li>)}</ol><div className="rounded-xl border border-brand-emerald/20 bg-brand-emerald/[.06] p-3 text-sm leading-7 text-brand-cream/70">تذكير: اسأل الطفل ماذا استمتع به، واحتفل بالمحاولة لا بالنتيجة فقط.</div></Card>
      <Card className="space-y-5 p-5 sm:p-6"><h2 className="text-2xl font-black text-brand-gold">إعدادات الطفل</h2><label className="block text-sm text-brand-cream/75">الفئة العمرية<select value={selectedAge} onChange={event => setSelectedAge(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-brand-cream"><option value="3-5">3–5 سنوات</option><option value="6-8">6–8 سنوات</option><option value="9-12">9–12 سنة</option><option value="13-15">13–15 سنة</option></select></label><label className="block text-sm text-brand-cream/75">الوقت اليومي: <strong className="text-brand-gold">{dailyMinutes} دقيقة</strong><input type="range" min="5" max="45" step="5" value={dailyMinutes} onChange={event => setDailyMinutes(Number(event.target.value))} className="mt-3 w-full accent-brand-gold" /></label><Button type="button" onClick={save}>حفظ إعدادات الأسرة</Button><p className="text-xs leading-6 text-brand-cream/50">تُحفظ هذه التفضيلات على هذا الجهاز، بينما تظهر النتائج المسجلة عند تسجيل الدخول.</p></Card>
    </div>
    <Card className="space-y-4 p-5 sm:p-6"><div><h2 className="text-2xl font-black text-brand-gold">التحكم بالمحتوى</h2><p className="mt-2 text-sm text-brand-cream/60">أوقف أي نوع من المحتوى مؤقتًا، ثم احفظ الإعدادات.</p></div><div className="grid gap-3 md:grid-cols-3">{CONTENT_OPTIONS.map(option => <label key={option.id} className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-4"><input type="checkbox" checked={allowed[option.id] ?? true} onChange={event => setAllowed(value => ({ ...value, [option.id]: event.target.checked }))} className="mt-1 h-5 w-5 accent-brand-gold" /><span><strong className="block text-brand-cream">{option.label}</strong><small className="mt-1 block leading-6 text-brand-cream/55">{option.description}</small></span></label>)}</div></Card>
    <Card className="p-5"><h2 className="text-2xl font-black text-brand-gold">خطة الحفظ والتسميع</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Plan title="هدف اليوم" value="مراجعة 5 دقائق" /><Plan title="التسميع" value="مرّة مع أحد الوالدين" /><Plan title="المراجعة" value="كل 3 أيام" /></div><p className="mt-4 text-sm leading-7 text-brand-cream/60">يمكن تحويل الخطة إلى عادة مرنة: جلسة قصيرة، تكرار لطيف، وتشجيع بلا عقاب أو مقارنة.</p></Card>
    <Card className="p-5"><h2 className="text-2xl font-black text-brand-gold">أكثر الألعاب نشاطًا</h2>{loading ? <p className="mt-3 text-sm text-brand-cream/60">جاري تحميل التقدم...</p> : games.length === 0 ? <p className="mt-3 text-sm text-brand-cream/60">سيظهر النشاط هنا بعد أول جولة.</p> : <div className="mt-3 grid gap-2 sm:grid-cols-2">{games.slice(0, 6).map(game => <div key={game.gameId} className="flex justify-between rounded-xl border border-white/10 p-3 text-sm"><span className="text-brand-cream/80">{game.gameId}</span><span className="text-brand-gold">{game.playCount} جولة</span></div>)}</div>}</Card>
  </Container>;
}
function Stat({ label, value }: { label: string; value: number }) { return <Card className="p-4 text-center"><p className="text-sm text-brand-cream/55">{label}</p><p className="mt-1 text-3xl font-black text-brand-gold">{value.toLocaleString("ar-SA")}</p></Card>; }
function Plan({ title, value }: { title: string; value: string }) { return <div className="rounded-xl border border-brand-emerald/20 bg-brand-emerald/[.05] p-4"><p className="text-xs text-brand-cream/50">{title}</p><p className="mt-2 font-bold text-brand-cream">{value}</p></div>; }

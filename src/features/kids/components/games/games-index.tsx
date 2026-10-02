"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GAME_REGISTRY, type GameAgeGroup, type GameDefinition, type GameDifficulty } from "@/lib/games/registry";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { KidsGameArt } from "@/features/kids/components/games/kids-game-art";

const ageLabels: Record<GameAgeGroup, string> = { "3-5": "3–5", "6-8": "6–8", "9-12": "9–12", "13-15": "13–15" };
const difficultyLabels: Record<GameDifficulty, string> = { easy: "سهل", normal: "متوسط", hard: "متقدم" };
const themeClasses: Record<string, string> = {
  emerald: "from-emerald-500/25 via-teal-500/10 to-transparent",
  gold: "from-amber-400/25 via-yellow-500/10 to-transparent",
  sky: "from-sky-400/25 via-cyan-500/10 to-transparent",
  violet: "from-violet-500/25 via-fuchsia-500/10 to-transparent",
  blue: "from-blue-500/25 via-indigo-500/10 to-transparent",
  teal: "from-teal-400/25 via-emerald-500/10 to-transparent",
  amber: "from-orange-400/25 via-amber-500/10 to-transparent",
  rose: "from-rose-400/25 via-pink-500/10 to-transparent",
  indigo: "from-indigo-400/25 via-blue-500/10 to-transparent",
  lime: "from-lime-400/25 via-green-500/10 to-transparent",
  fuchsia: "from-fuchsia-400/25 via-pink-500/10 to-transparent",
};


type ProgressResponse = { games?: Array<{ gameId: string; bestScore: number }> };

export default function KidsGamesIndex() {
  const [query, setQuery] = useState("");
  const [age, setAge] = useState<GameAgeGroup | "all">("all");
  const [difficulty, setDifficulty] = useState<GameDifficulty | "all">("all");
  const [category, setCategory] = useState("all");
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const definitions = Object.values(GAME_REGISTRY);
  const categories = [...new Set(definitions.map(game => game.category))];
  const recommended = definitions.filter(game => game.recommended);

  useEffect(() => {
    let active = true;
    fetch("/api/kids/games/progress", { credentials: "include" })
      .then(response => response.ok ? response.json() as Promise<ProgressResponse> : null)
      .then(data => { if (active && data?.games) setBestScores(Object.fromEntries(data.games.map(item => [item.gameId, item.bestScore]))); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => definitions.filter(game => {
    const text = `${game.titleAr} ${game.titleEn} ${game.descriptionAr} ${game.goalAr} ${game.skillAr}`.toLowerCase();
    const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchesAge = age === "all" || (game.supportedAgeGroups as readonly string[]).includes(age);
    const matchesDifficulty = difficulty === "all" || (game.difficulties as readonly string[]).includes(difficulty);
    const matchesCategory = category === "all" || game.category === category;
    return matchesQuery && matchesAge && matchesDifficulty && matchesCategory;
  }), [age, category, definitions, difficulty, query]);

  const clearFilters = () => { setQuery(""); setAge("all"); setDifficulty("all"); setCategory("all"); };

  return <Container className="space-y-9 py-10" dir="rtl">
    <section className="relative overflow-hidden rounded-[2rem] border border-brand-gold/20 bg-[radial-gradient(circle_at_top_left,#d7ad4b18,transparent_38%),linear-gradient(135deg,#071b24,#0c2b35)] p-6 shadow-2xl shadow-black/20 md:p-10">
      <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-brand-gold/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">عالم ذِكر للأطفال</span>
          <div className="space-y-3"><h1 className="max-w-2xl text-4xl font-black leading-tight text-brand-cream md:text-6xl">تعلّم، العب،<br /><span className="text-brand-gold">واخطُ خطوتك التالية</span></h1><p className="max-w-2xl text-base leading-8 text-brand-cream/70 md:text-lg">ألعاب قصيرة وآمنة تساعد الطفل على التركيز والتذكر والإبداع، مع تقدم محفوظ دون مقارنة مع الآخرين.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="#recommended" className="rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-black shadow-lg shadow-brand-gold/10 transition hover:-translate-y-0.5 hover:bg-brand-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold">ابدأ من هنا</Link><Link href="/kids" className="rounded-xl border border-brand-cream/15 px-5 py-3 text-sm text-brand-cream/80 transition hover:border-brand-gold hover:text-brand-gold">قسم الأطفال</Link><Link href="/kids/progress" className="rounded-xl border border-brand-emerald/30 px-5 py-3 text-sm text-brand-emerald transition hover:border-brand-gold">تقدمي</Link></div>
        </div>
        <div className="rounded-3xl border border-brand-cream/10 bg-black/20 p-5 backdrop-blur-sm"><p className="text-sm font-semibold text-brand-emerald">رحلة قصيرة تناسب يومك</p><div className="mt-4 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-brand-cream/5 p-3"><strong className="block text-2xl text-brand-gold">{definitions.length}</strong><span className="text-xs text-brand-cream/60">لعبة أصلية</span></div><div className="rounded-2xl bg-brand-cream/5 p-3"><strong className="block text-2xl text-brand-gold">3–12</strong><span className="text-xs text-brand-cream/60">سنة</span></div><div className="rounded-2xl bg-brand-cream/5 p-3"><strong className="block text-2xl text-brand-gold">3–7</strong><span className="text-xs text-brand-cream/60">دقائق</span></div></div><p className="mt-4 text-sm leading-7 text-brand-cream/65">اختر لعبة واحدة، جرّب بهدوء، ثم عد متى أحببت. الهدف هو التعلم الممتع.</p></div>
      </div>
    </section>

    <section id="recommended" className="scroll-mt-6 space-y-4" aria-labelledby="recommended-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-brand-emerald">المسار المقترح</p><h2 id="recommended-heading" className="text-2xl font-bold text-brand-cream">ابدأ بلعبة تناسبك</h2></div><span className="text-sm text-brand-cream/50">خطوة واحدة تكفي اليوم</span></div><div className="grid gap-4 lg:grid-cols-3">{recommended.map(game => <RecommendedCard key={game.id} game={game} bestScore={bestScores[game.id] ?? 0} />)}</div></section>

    <section className="space-y-4" aria-labelledby="all-games-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-brand-emerald">كل الألعاب</p><h2 id="all-games-heading" className="text-2xl font-bold text-brand-cream">اختر مغامرتك التالية</h2></div><p className="text-sm text-brand-cream/60" aria-live="polite">تظهر {filtered.length} لعبة من أصل {definitions.length}</p></div><div className="grid gap-3 rounded-2xl border border-brand-cream/10 bg-black/15 p-4 md:grid-cols-4" aria-label="تصفية الألعاب"><label className="space-y-1 text-sm text-brand-cream/70">بحث<input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن لعبة أو مهارة" className="w-full rounded-xl border border-brand-cream/15 bg-black/20 p-3 text-brand-cream outline-none transition focus:border-brand-gold" /></label><label className="space-y-1 text-sm text-brand-cream/70">العمر<select value={age} onChange={event => setAge(event.target.value as GameAgeGroup | "all")} className="w-full rounded-xl border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">كل الأعمار</option>{Object.keys(ageLabels).map(value => <option key={value} value={value}>{ageLabels[value as GameAgeGroup]} سنوات</option>)}</select></label><label className="space-y-1 text-sm text-brand-cream/70">الصعوبة<select value={difficulty} onChange={event => setDifficulty(event.target.value as GameDifficulty | "all")} className="w-full rounded-xl border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">كل المستويات</option>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="space-y-1 text-sm text-brand-cream/70">الفئة<select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-xl border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">كل الفئات</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div><div className="flex min-h-6 justify-end">{(query || age !== "all" || difficulty !== "all" || category !== "all") && <button type="button" onClick={clearFilters} className="text-sm text-brand-gold underline underline-offset-4">مسح الفلاتر</button>}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="قائمة الألعاب">{filtered.map(game => <GameCard key={game.id} game={game} bestScore={bestScores[game.id] ?? 0} />)}</div>{filtered.length === 0 && <Card className="p-8 text-center text-brand-cream/70">لم نجد لعبة بهذه الفلاتر. <button type="button" onClick={clearFilters} className="text-brand-gold underline underline-offset-4">جرّب اختياراً آخر</button></Card>}</section>
  </Container>;
}

function GameCardArt({ game }: { game: GameDefinition }) {
  return (
    <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#071923]">
      <KidsGameArt gameId={game.id} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 text-center text-[11px] font-semibold tracking-wide text-brand-cream/70">
        {game.category}
      </div>
    </div>
  );
}
function RecommendedCard({ game, bestScore }: { game: GameDefinition; bestScore: number }) {
  return <Link href={`/kids/${game.id}`} className="group block"><Card className={`relative h-full overflow-hidden border-brand-gold/20 bg-gradient-to-br ${themeClasses[game.theme]} from-10% p-5 transition duration-200 hover:-translate-y-1 hover:border-brand-gold/60`}><div className="relative"><GameCardArt game={game} /></div><div className="relative mt-4 flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold text-brand-cream">{game.titleAr}</h3><p className="mt-1 text-xs text-brand-cream/50">{game.titleEn}</p></div><span className="rounded-full bg-brand-gold px-3 py-1 text-xs font-bold text-black">مقترحة</span></div><div className="relative mt-3 space-y-2"><p className="text-sm leading-7 text-brand-cream/70">{game.storyAr}</p><p className="text-sm font-semibold text-brand-gold">{game.goalAr}</p></div><div className="relative mt-5 flex items-center justify-between gap-3 text-xs text-brand-cream/60"><span>{game.durationMinutes} دقائق · {ageLabels[game.supportedAgeGroups[0]]} سنوات</span><span>{bestScore > 0 ? `أفضل نتيجة ${bestScore.toLocaleString("ar-SA")}` : "لم تبدأ بعد"}</span></div><div className="relative mt-4 rounded-xl bg-brand-gold px-4 py-3 text-center text-sm font-bold text-black transition group-hover:bg-brand-gold/90">ابدأ الآن</div></Card></Link>;
}

function GameCard({ game, bestScore }: { game: GameDefinition; bestScore: number }) {
  return <Link href={`/kids/${game.id}`} className="group block"><Card className="relative flex h-full flex-col gap-4 overflow-hidden border-brand-cream/10 bg-black/15 p-5 transition duration-200 hover:-translate-y-1 hover:border-brand-gold/50"><div className="relative"><GameCardArt game={game} /></div><div className="relative flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold text-brand-gold">{game.titleAr}</h3><p className="mt-1 text-xs text-brand-cream/50">{game.titleEn}</p></div><span className="rounded-full bg-brand-emerald/10 px-3 py-1 text-xs text-brand-emerald">{game.category}</span></div><div className="relative"><p className="text-sm font-semibold leading-relaxed text-brand-cream/85">{game.goalAr}</p><p className="mt-2 text-sm leading-relaxed text-brand-cream/60">{game.descriptionAr}</p></div><div className="relative mt-auto flex flex-wrap gap-2 text-xs"><span className="rounded bg-brand-cream/10 px-2 py-1 text-brand-cream/70">{game.supportedAgeGroups.map(item => ageLabels[item]).join("، ")} سنة</span><span className="rounded bg-brand-gold/10 px-2 py-1 text-brand-gold">{difficultyLabels[game.defaultDifficulty]}</span><span className="rounded bg-brand-emerald/10 px-2 py-1 text-brand-emerald">{game.skillAr}</span></div><div className="relative flex items-center justify-between gap-3 text-xs text-brand-cream/50"><span>{game.durationMinutes} دقائق · تصميم خاص</span><span>{bestScore > 0 ? `أفضل نتيجة: ${bestScore.toLocaleString("ar-SA")}` : "جديدة عليك"}</span></div><span className="relative rounded-xl border border-brand-gold/40 px-4 py-3 text-center text-sm font-bold text-brand-gold transition group-hover:bg-brand-gold group-hover:text-black">عرض الهدف وابدأ</span></Card></Link>;
}

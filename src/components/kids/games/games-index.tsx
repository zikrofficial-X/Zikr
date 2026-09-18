"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GAME_REGISTRY, type GameDifficulty, type GameId, type GameAgeGroup } from "@/lib/games/registry";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const ageLabels: Record<GameAgeGroup, string> = { "3-5": "3–5", "6-8": "6–8", "9-12": "9–12", "13-15": "13–15" };
const difficultyLabels: Record<GameDifficulty, string> = { easy: "سهل", normal: "متوسط", hard: "متقدم" };

type ProgressResponse = { games?: Array<{ gameId: string; bestScore: number }> };

export default function KidsGamesIndex() {
  const [query, setQuery] = useState("");
  const [age, setAge] = useState<GameAgeGroup | "all">("all");
  const [difficulty, setDifficulty] = useState<GameDifficulty | "all">("all");
  const [category, setCategory] = useState("all");
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const definitions = Object.values(GAME_REGISTRY);
  const categories = [...new Set(definitions.map(game => game.category))];

  useEffect(() => {
    let active = true;
    fetch("/api/kids/games/progress", { credentials: "include" })
      .then(response => response.ok ? response.json() as Promise<ProgressResponse> : null)
      .then(data => { if (active && data?.games) setBestScores(Object.fromEntries(data.games.map(item => [item.gameId, item.bestScore]))); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => definitions.filter(game => {
    const text = `${game.titleAr} ${game.titleEn} ${game.descriptionAr}`.toLowerCase();
    const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchesAge = age === "all" || (game.supportedAgeGroups as readonly string[]).includes(age);
    const matchesDifficulty = difficulty === "all" || (game.difficulties as readonly string[]).includes(difficulty);
    const matchesCategory = category === "all" || game.category === category;
    return matchesQuery && matchesAge && matchesDifficulty && matchesCategory;
  }), [age, category, definitions, difficulty, query]);

  return <Container className="space-y-8 py-10" dir="rtl">
    <section className="space-y-4 text-center"><span className="inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold">عالم ذِكر للأطفال</span><h1 className="text-4xl font-bold text-brand-gold md:text-5xl">ألعاب ذِكر وتعلم</h1><p className="mx-auto max-w-2xl text-lg leading-relaxed text-brand-cream/70">اختر لعبة قصيرة، تعلم بهدوء، وتابع تقدمك دون مقارنة مع الآخرين.</p><div className="flex flex-wrap justify-center gap-3"><Link href="/kids" className="rounded-lg border border-brand-cream/15 px-4 py-2 text-sm text-brand-cream/75 hover:border-brand-gold">قسم الأطفال</Link><Link href="/kids/progress" className="rounded-lg border border-brand-emerald/30 px-4 py-2 text-sm text-brand-emerald hover:border-brand-gold">تقدمي</Link><Link href="/kids/achievements" className="rounded-lg border border-brand-gold/30 px-4 py-2 text-sm text-brand-gold hover:border-brand-gold">الشارات</Link></div></section>
    <section className="grid gap-3 rounded-2xl border border-brand-cream/10 bg-black/15 p-4 md:grid-cols-4" aria-label="تصفية الألعاب"><label className="space-y-1 text-sm text-brand-cream/70">بحث<input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن لعبة" className="w-full rounded-lg border border-brand-cream/15 bg-black/20 p-3 text-brand-cream outline-none focus:border-brand-gold" /></label><label className="space-y-1 text-sm text-brand-cream/70">العمر<select value={age} onChange={event => setAge(event.target.value as GameAgeGroup | "all")} className="w-full rounded-lg border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">كل الأعمار</option>{Object.keys(ageLabels).map(value => <option key={value} value={value}>{ageLabels[value as GameAgeGroup]} سنوات</option>)}</select></label><label className="space-y-1 text-sm text-brand-cream/70">الصعوبة<select value={difficulty} onChange={event => setDifficulty(event.target.value as GameDifficulty | "all")} className="w-full rounded-lg border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">كل المستويات</option>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="space-y-1 text-sm text-brand-cream/70">الفئة<select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-lg border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">كل الفئات</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label></section>
    <p className="text-sm text-brand-cream/60" aria-live="polite">تظهر {filtered.length} لعبة من أصل {definitions.length}</p>
    <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="قائمة الألعاب">{filtered.map(game => <GameCard key={game.id} game={game} bestScore={bestScores[game.id] ?? 0} />)}</section>
    {filtered.length === 0 && <Card className="p-8 text-center text-brand-cream/70">لم نجد لعبة بهذه الفلاتر. جرّب اختيارًا آخر.</Card>}
  </Container>;
}

function GameCard({ game, bestScore }: { game: typeof GAME_REGISTRY[GameId]; bestScore: number }) {
  return <Link href={`/kids/${game.id}`} className="group block"><Card className="flex h-full flex-col gap-4 border-brand-cream/10 bg-black/15 p-5 transition hover:-translate-y-1 hover:border-brand-gold/50"><div className="flex items-start justify-between gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-brand-gold/30 bg-brand-gold/10 text-3xl text-brand-gold" aria-hidden="true">{game.icon}</span><span className="rounded-full bg-brand-emerald/10 px-3 py-1 text-xs text-brand-emerald">{game.category}</span></div><div><h2 className="text-xl font-bold text-brand-gold">{game.titleAr}</h2><p className="mt-1 text-xs text-brand-cream/50">{game.titleEn}</p><p className="mt-3 text-sm leading-relaxed text-brand-cream/70">{game.descriptionAr}</p></div><div className="mt-auto flex flex-wrap gap-2 text-xs"><span className="rounded bg-brand-cream/10 px-2 py-1 text-brand-cream/70">{game.supportedAgeGroups.map(item => ageLabels[item]).join("، ")} سنة</span><span className="rounded bg-brand-gold/10 px-2 py-1 text-brand-gold">{difficultyLabels[game.defaultDifficulty]}</span><span className="rounded bg-brand-emerald/10 px-2 py-1 text-brand-emerald">أفضل نتيجة: {bestScore.toLocaleString("ar-SA")}</span></div><span className="rounded-lg bg-brand-gold px-4 py-2 text-center text-sm font-bold text-black transition group-hover:bg-brand-gold/90">ابدأ اللعب</span></Card></Link>;
}

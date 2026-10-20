"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GAME_REGISTRY, type GameAgeGroup, type GameDefinition, type GameDifficulty } from "@/lib/games/registry";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { KidsGameArt } from "@/features/kids/components/games/kids-game-art";
import { useLanguage } from "@/components/layout/language-provider";
import { normalizeKidsGameSearch } from "@/lib/games/search";

const ageLabels: Record<GameAgeGroup, string> = { "3-5": "3–5", "6-8": "6–8", "9-12": "9–12", "13-15": "13–15" };
type DurationFilter = "all" | "quick" | "standard" | "deep";
const durationRanges: Record<Exclude<DurationFilter, "all">, [number, number]> = { quick: [0, 5], standard: [6, 10], deep: [11, Number.POSITIVE_INFINITY] };
const difficultyLabels = { ar: { easy: "سهل", normal: "متوسط", hard: "متقدم" }, en: { easy: "Easy", normal: "Normal", hard: "Advanced" } } as const;
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
  const { isEnglish } = useLanguage();
  const labels = isEnglish ? {
    gameWorld: "ZIKR Kids", learnPlay: "Learn, play,", nextStep: "take your next step",
    intro: "Short, safe games that help children practice focus, memory, and creativity, with progress saved without comparing them to others.",
    start: "Start here", kidsSection: "Kids section", progress: "My progress", journey: "A short journey for your day",
    originalGames: "Original games", years: "years", minutes: "minutes", choose: "Choose your next adventure",
    path: "Recommended path", startGame: "Start a game that fits you", oneStep: "One step is enough for today",
    allGames: "All games", filter: "Filter games", search: "Search", searchPlaceholder: "Search by game or skill",
    age: "Age", allAges: "All ages", difficulty: "Difficulty", allLevels: "All levels", category: "Category",
    allCategories: "All categories", duration: "Play time", allDurations: "Any duration", quick: "Up to 5 min", standard: "6–10 min", deep: "11+ min", clear: "Clear filters", showing: "Showing", games: "games",
    noGames: "No game matches these filters.", tryAnother: "Try another selection", suggested: "Recommended",
    notStarted: "Not started", bestScore: "Best score", startNow: "Start now", viewStart: "View goal and start",
    newForYou: "New for you", customDesign: "Custom design"
  } : {
    gameWorld: "عالم ذِكر للأطفال", learnPlay: "تعلّم، العب،", nextStep: "واخطُ خطوتك التالية",
    intro: "ألعاب قصيرة وآمنة تساعد الطفل على التركيز والتذكر والإبداع، مع تقدم محفوظ دون مقارنة مع الآخرين.",
    start: "ابدأ من هنا", kidsSection: "قسم الأطفال", progress: "تقدمي", journey: "رحلة قصيرة تناسب يومك",
    originalGames: "لعبة أصلية", years: "سنة", minutes: "دقائق", choose: "اختر مغامرتك التالية",
    path: "المسار المقترح", startGame: "ابدأ بلعبة تناسبك", oneStep: "خطوة واحدة تكفي اليوم",
    allGames: "كل الألعاب", filter: "تصفية الألعاب", search: "بحث", searchPlaceholder: "ابحث عن لعبة أو مهارة",
    age: "العمر", allAges: "كل الأعمار", difficulty: "الصعوبة", allLevels: "كل المستويات", category: "الفئة",
    allCategories: "كل الفئات", duration: "مدة اللعب", allDurations: "أي مدة", quick: "حتى 5 دقائق", standard: "6–10 دقائق", deep: "11 دقيقة فأكثر", clear: "مسح الفلاتر", showing: "تظهر", games: "لعبة",
    noGames: "لم نجد لعبة بهذه الفلاتر.", tryAnother: "جرّب اختياراً آخر", suggested: "مقترحة",
    notStarted: "لم تبدأ بعد", bestScore: "أفضل نتيجة", startNow: "ابدأ الآن", viewStart: "عرض الهدف وابدأ",
    newForYou: "جديدة عليك", customDesign: "تصميم خاص"
  };
  const difficultyCopy = isEnglish ? difficultyLabels.en : difficultyLabels.ar;
  const [query, setQuery] = useState("");
  const [age, setAge] = useState<GameAgeGroup | "all">("all");
  const [difficulty, setDifficulty] = useState<GameDifficulty | "all">("all");
  const [category, setCategory] = useState("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const definitions = Object.values(GAME_REGISTRY);
  const categories = [...new Set(definitions.map(game => isEnglish ? game.categoryEn : game.category))];
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
    const text = normalizeKidsGameSearch(
      isEnglish
        ? `${game.titleEn} ${game.descriptionEn} ${game.goalEn} ${game.skillEn}`
        : `${game.titleAr} ${game.descriptionAr} ${game.goalAr} ${game.skillAr}`,
    );
    const normalizedQuery = normalizeKidsGameSearch(query);
    const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
    const matchesAge = age === "all" || (game.supportedAgeGroups as readonly string[]).includes(age);
    const matchesDifficulty = difficulty === "all" || (game.difficulties as readonly string[]).includes(difficulty);
    const matchesCategory = category === "all" || (isEnglish ? game.categoryEn : game.category) === category;
    const matchesDuration = duration === "all" || (() => { const [min, max] = durationRanges[duration]; return game.durationMinutes >= min && game.durationMinutes <= max; })();
    return matchesQuery && matchesAge && matchesDifficulty && matchesCategory && matchesDuration;
  }), [age, category, definitions, difficulty, duration, isEnglish, query]);

  const clearFilters = () => { setQuery(""); setAge("all"); setDifficulty("all"); setCategory("all"); setDuration("all"); };

  return <Container className="min-w-0 space-y-7 py-6 sm:space-y-9 sm:py-10" dir={isEnglish ? "ltr" : "rtl"}>
    <section className="relative min-w-0 overflow-hidden rounded-[1.5rem] border border-brand-gold/20 bg-[radial-gradient(circle_at_top_left,#d7ad4b18,transparent_38%),linear-gradient(135deg,#071b24,#0c2b35)] p-4 shadow-2xl shadow-black/20 sm:rounded-[2rem] sm:p-6 md:p-10">
      <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-brand-gold/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">{labels.gameWorld}</span>
          <div className="space-y-3"><h1 className="max-w-2xl break-words text-3xl font-black leading-tight text-brand-cream sm:text-4xl md:text-6xl">{isEnglish ? labels.learnPlay : "تعلّم، العب،"}<br /><span className="text-brand-gold">{labels.nextStep}</span></h1><p className="max-w-2xl break-words text-sm leading-7 text-brand-cream/70 sm:text-base sm:leading-8 md:text-lg">{labels.intro}</p></div>
          <div className="flex flex-wrap gap-3"><Link href="#recommended" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-gold px-4 py-3 text-sm font-bold text-black shadow-lg shadow-brand-gold/10 transition hover:-translate-y-0.5 hover:bg-brand-gold/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold sm:px-5">{labels.start}</Link><Link href="/kids" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-cream/15 px-4 py-3 text-sm text-brand-cream/80 transition hover:border-brand-gold hover:text-brand-gold">{labels.kidsSection}</Link><Link href="/kids/progress" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-emerald/30 px-4 py-3 text-sm text-brand-emerald transition hover:border-brand-gold">{labels.progress}</Link></div>
        </div>
        <div className="min-w-0 rounded-3xl border border-brand-cream/10 bg-black/20 p-3 backdrop-blur-sm sm:p-5"><p className="text-sm font-semibold text-brand-emerald">{labels.journey}</p><div className="mt-4 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-brand-cream/5 p-3"><strong className="block text-2xl text-brand-gold">{definitions.length}</strong><span className="text-xs text-brand-cream/60">{labels.originalGames}</span></div><div className="rounded-2xl bg-brand-cream/5 p-3"><strong className="block text-2xl text-brand-gold">3–12</strong><span className="text-xs text-brand-cream/60">{labels.years}</span></div><div className="rounded-2xl bg-brand-cream/5 p-3"><strong className="block text-2xl text-brand-gold">3–7</strong><span className="text-xs text-brand-cream/60">{labels.minutes}</span></div></div><p className="mt-4 text-sm leading-7 text-brand-cream/65">{isEnglish ? "Choose one game, take your time, and come back whenever you like. The goal is enjoyable learning." : "اختر لعبة واحدة، جرّب بهدوء، ثم عد متى أحببت. الهدف هو التعلم الممتع."}</p></div>
      </div>
    </section>

    <section id="recommended" className="scroll-mt-6 space-y-4" aria-labelledby="recommended-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-brand-emerald">{labels.path}</p><h2 id="recommended-heading" className="break-words text-xl font-bold text-brand-cream sm:text-2xl">{labels.startGame}</h2></div><span className="text-sm text-brand-cream/50">{labels.oneStep}</span></div><div className="grid gap-3 sm:gap-4 lg:grid-cols-3">{recommended.map(game => <RecommendedCard key={game.id} game={game} bestScore={bestScores[game.id] ?? 0} />)}</div></section>

    <section className="space-y-4" aria-labelledby="all-games-heading"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-brand-emerald">{labels.allGames}</p><h2 id="all-games-heading" className="break-words text-xl font-bold text-brand-cream sm:text-2xl">{labels.choose}</h2></div><p className="text-sm text-brand-cream/60" aria-live="polite">{labels.showing} {filtered.length} {labels.games} {isEnglish ? "of" : "من أصل"} {definitions.length}</p></div><div className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-brand-cream/10 bg-black/15 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4" aria-label={labels.filter}><label className="space-y-1 text-sm text-brand-cream/70">{labels.search}<input value={query} onChange={event => setQuery(event.target.value)} placeholder={labels.searchPlaceholder} className="min-h-11 w-full min-w-0 rounded-xl border border-brand-cream/15 bg-black/20 p-3 text-brand-cream outline-none transition focus:border-brand-gold focus-visible:ring-2 focus-visible:ring-brand-gold" /></label><label className="space-y-1 text-sm text-brand-cream/70">{labels.age}<select value={age} onChange={event => setAge(event.target.value as GameAgeGroup | "all")} className="min-h-11 w-full min-w-0 rounded-xl border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold"><option value="all">{labels.allAges}</option>{Object.keys(ageLabels).map(value => <option key={value} value={value}>{ageLabels[value as GameAgeGroup]} {labels.years}</option>)}</select></label><label className="space-y-1 text-sm text-brand-cream/70">{labels.difficulty}<select value={difficulty} onChange={event => setDifficulty(event.target.value as GameDifficulty | "all")} className="w-full rounded-xl border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">{labels.allLevels}</option>{Object.entries(difficultyCopy).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="space-y-1 text-sm text-brand-cream/70">{labels.category}<select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-xl border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">{labels.allCategories}</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="space-y-1 text-sm text-brand-cream/70">{labels.duration}<select value={duration} onChange={event => setDuration(event.target.value as DurationFilter)} className="w-full rounded-xl border border-brand-cream/15 bg-[#102f3a] p-3 text-brand-cream"><option value="all">{labels.allDurations}</option><option value="quick">{labels.quick}</option><option value="standard">{labels.standard}</option><option value="deep">{labels.deep}</option></select></label></div><div className="flex min-h-6 justify-end">{(query || age !== "all" || difficulty !== "all" || category !== "all" || duration !== "all") && <button type="button" onClick={clearFilters} className="text-sm text-brand-gold underline underline-offset-4">{labels.clear}</button>}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label={labels.allGames}>{filtered.map(game => <GameCard key={game.id} game={game} bestScore={bestScores[game.id] ?? 0} />)}</div>{filtered.length === 0 && <Card className="p-8 text-center text-brand-cream/70">{labels.noGames} <button type="button" onClick={clearFilters} className="text-brand-gold underline underline-offset-4">{labels.tryAnother}</button></Card>}</section>
  </Container>;
}

function GameCardArt({ game }: { game: GameDefinition }) {
  const { isEnglish } = useLanguage();
  return (
    <div className="relative h-36 overflow-hidden rounded-2xl border border-white/10 bg-[#071923] sm:h-40">
      <KidsGameArt gameId={game.id} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 text-center text-[11px] font-semibold tracking-wide text-brand-cream/70">
        {isEnglish ? game.categoryEn : game.category}
      </div>
    </div>
  );
}
function RecommendedCard({ game, bestScore }: { game: GameDefinition; bestScore: number }) {
  const { isEnglish } = useLanguage();
  const labels = isEnglish ? { suggested: "Recommended", minutes: "minutes", years: "years", bestScore: "Best score", notStarted: "Not started", startNow: "Start now" } : { suggested: "مقترحة", minutes: "دقائق", years: "سنة", bestScore: "أفضل نتيجة", notStarted: "لم تبدأ بعد", startNow: "ابدأ الآن" };
  const ages = game.supportedAgeGroups.map((age) => ageLabels[age]).join(isEnglish ? ", " : "، ");
  return <Link href={`/kids/${game.id}`} className="group block"><Card className={`relative h-full min-w-0 overflow-hidden border-brand-gold/20 bg-gradient-to-br ${themeClasses[game.theme]} from-10% p-4 transition duration-200 hover:-translate-y-1 hover:border-brand-gold/60 sm:p-5`}><div className="relative"><GameCardArt game={game} /></div><div className="relative mt-4 flex items-start justify-between gap-3"><div><h3 className="break-words text-lg font-bold text-brand-cream sm:text-xl">{isEnglish ? game.titleEn : game.titleAr}</h3>{!isEnglish && <p className="mt-1 text-xs text-brand-cream/50">{game.titleEn}</p>}</div><span className="rounded-full bg-brand-gold px-3 py-1 text-xs font-bold text-black">{labels.suggested}</span></div><div className="relative mt-3 space-y-2"><p className="text-sm leading-7 text-brand-cream/70">{isEnglish ? game.storyEn : game.storyAr}</p><p className="text-sm font-semibold text-brand-gold">{isEnglish ? game.goalEn : game.goalAr}</p></div><div className="relative mt-5 flex items-center justify-between gap-3 text-xs text-brand-cream/60"><span>{game.durationMinutes} {labels.minutes} · {ages} {labels.years}</span><span>{bestScore > 0 ? `${labels.bestScore}: ${bestScore.toLocaleString(isEnglish ? "en-US" : "ar-SA")}` : labels.notStarted}</span></div><div className="relative mt-4 rounded-xl bg-brand-gold px-4 py-3 text-center text-sm font-bold text-black transition group-hover:bg-brand-gold/90">{labels.startNow}</div></Card></Link>;
}

function GameCard({ game, bestScore }: { game: GameDefinition; bestScore: number }) {
  const { isEnglish } = useLanguage();
  const labels = isEnglish ? { minutes: "minutes", years: "years", bestScore: "Best score", newForYou: "New for you", customDesign: "Custom design", viewStart: "View goal and start" } : { minutes: "دقائق", years: "سنة", bestScore: "أفضل نتيجة", newForYou: "جديدة عليك", customDesign: "تصميم خاص", viewStart: "عرض الهدف وابدأ" };
  const difficultyCopy = isEnglish ? difficultyLabels.en : difficultyLabels.ar;
  return <Link href={`/kids/${game.id}`} className="group block"><Card className="relative flex h-full min-w-0 flex-col gap-4 overflow-hidden border-brand-cream/10 bg-black/15 p-4 transition duration-200 hover:-translate-y-1 hover:border-brand-gold/50 sm:p-5"><div className="relative"><GameCardArt game={game} /></div><div className="relative flex items-start justify-between gap-3"><div><h3 className="break-words text-lg font-bold text-brand-gold sm:text-xl">{isEnglish ? game.titleEn : game.titleAr}</h3>{!isEnglish && <p className="mt-1 text-xs text-brand-cream/50">{game.titleEn}</p>}</div><span className="rounded-full bg-brand-emerald/10 px-3 py-1 text-xs text-brand-emerald">{isEnglish ? game.categoryEn : game.category}</span></div><div className="relative"><p className="text-sm font-semibold leading-relaxed text-brand-cream/85">{isEnglish ? game.goalEn : game.goalAr}</p><p className="mt-2 text-sm leading-relaxed text-brand-cream/60">{isEnglish ? game.descriptionEn : game.descriptionAr}</p></div><div className="relative mt-auto flex flex-wrap gap-2 text-xs"><span className="rounded bg-brand-cream/10 px-2 py-1 text-brand-cream/70">{game.supportedAgeGroups.map(item => ageLabels[item]).join(isEnglish ? ", " : "، ")} {labels.years}</span><span className="rounded bg-brand-gold/10 px-2 py-1 text-brand-gold">{difficultyCopy[game.defaultDifficulty]}</span><span className="rounded bg-brand-emerald/10 px-2 py-1 text-brand-emerald">{isEnglish ? game.skillEn : game.skillAr}</span></div><div className="relative flex items-center justify-between gap-3 text-xs text-brand-cream/50"><span>{game.durationMinutes} {labels.minutes} · {labels.customDesign}</span><span>{bestScore > 0 ? `${labels.bestScore}: ${bestScore.toLocaleString(isEnglish ? "en-US" : "ar-SA")}` : labels.newForYou}</span></div><span className="relative rounded-xl border border-brand-gold/40 px-4 py-3 text-center text-sm font-bold text-brand-gold transition group-hover:bg-brand-gold group-hover:text-black">{labels.viewStart}</span></Card></Link>;
}

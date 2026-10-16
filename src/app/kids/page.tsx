"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { kidsContent } from "@/features/kids/data/content";
import { GAME_REGISTRY } from "@/lib/games/registry";
import { KidsGameArt } from "@/features/kids/components/games/kids-game-art";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/layout/language-provider";

const journeys = [
  { icon: "📖", titleAr: "حكاية اليوم", titleEn: "Story of the day", descriptionAr: "اقرأ قصة قصيرة، ثم اكتشف قيمة عملية يمكنك تجربتها اليوم.", descriptionEn: "Read a short story, then discover one practical value to try today.", href: "/kids/story-ibrahim", color: "from-amber-400/25 to-orange-500/5" },
  { icon: "💧", titleAr: "خطوة نتعلمها", titleEn: "A step to learn", descriptionAr: "تعلم الوضوء والصلاة والأدعية بلغة سهلة وخطوات واضحة.", descriptionEn: "Learn wudu, prayer, and supplications with simple steps.", href: "/kids/wudu-steps", color: "from-sky-400/25 to-cyan-500/5" },
  { icon: "🎮", titleAr: "جولة ممتعة", titleEn: "A fun round", descriptionAr: "اختر لعبة قصيرة تنمي التركيز والذاكرة والإبداع بلا ضغط.", descriptionEn: "Choose a short game that builds focus, memory, and creativity without pressure.", href: "/kids/games", color: "from-fuchsia-400/25 to-violet-500/5" },
];

const contentTypeLabels = {
  ar: { story: "قصة", prayer: "دعاء", wudu: "تعلم", quiz: "اختبار", memorize: "حفظ", puzzle: "لغز" },
  en: { story: "Story", prayer: "Dua", wudu: "Learning", quiz: "Quiz", memorize: "Memorization", puzzle: "Puzzle" },
} as const;

const contentTypeIcons: Record<string, string> = {
  story: "📖",
  prayer: "🤲",
  wudu: "💧",
  quiz: "🧠",
  memorize: "🌟",
  puzzle: "🧩",
};

export default function KidsPage() {
  const { isEnglish } = useLanguage();
  const [contentItems, setContentItems] = useState(kidsContent);
  useEffect(() => {
    let active = true;
    fetch("/api/kids/content", { credentials: "include", cache: "no-store" })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (active && Array.isArray(data)) setContentItems(data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isEnglish]);
  const featuredContent = contentItems.filter((item) => ["story", "prayer", "wudu", "quiz"].includes(item.type)).slice(0, 6);
  const typeLabels = isEnglish ? contentTypeLabels.en : contentTypeLabels.ar;
  const featuredGames = [GAME_REGISTRY["zikr-runner"], GAME_REGISTRY["zikr-memory"], GAME_REGISTRY["wudu-challenge"], GAME_REGISTRY["mosque-adventure"], GAME_REGISTRY["good-deeds"], GAME_REGISTRY["zikr-coloring"]];

  return (
    <main dir={isEnglish ? "ltr" : "rtl"} className="min-h-screen overflow-hidden bg-[#061b24] text-brand-cream">
      <section className="relative isolate overflow-hidden border-b border-brand-gold/15 bg-[radial-gradient(circle_at_15%_10%,rgba(199,168,107,.26),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(73,185,170,.22),transparent_32%),linear-gradient(135deg,#092631,#07151d)]">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" aria-hidden="true" />
        <Container className="relative grid gap-8 py-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm font-bold text-brand-gold">{isEnglish ? "🌈 ZIKR Kids" : "🌈 عالم ذِكر للأطفال"}</span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-[1.2] text-brand-cream md:text-6xl">{isEnglish ? "Learn, play," : "نتعلم، نلعب،"}<br /><span className="text-brand-gold">{isEnglish ? "and grow one good step at a time" : "ونكبر بخطوة جميلة"}</span></h1>
              <p className="max-w-2xl text-base leading-8 text-brand-cream/75 md:text-xl">{isEnglish ? "A calm, safe space for children: short stories, remembrance and supplications, learning activities, and games that build skills without comparison or pressure." : "مساحة هادئة وآمنة للأطفال: قصص قصيرة، أذكار وأدعية، أنشطة تعليمية، وألعاب تنمي المهارات دون مقارنات أو ضغط."}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/kids/games" className="rounded-2xl bg-brand-gold px-6 py-3 font-bold text-black shadow-lg shadow-brand-gold/15 transition hover:-translate-y-0.5 hover:bg-[#e1c27d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-gold">{isEnglish ? "Start playing 🎮" : "ابدأ اللعب 🎮"}</Link>
              <Link href="#learning" className="rounded-2xl border border-brand-cream/20 bg-white/5 px-6 py-3 font-bold text-brand-cream transition hover:border-brand-gold hover:text-brand-gold">{isEnglish ? "Explore the learning path" : "اكتشف مسار التعلم"}</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-brand-cream/15 bg-white/[.06] p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-l from-fuchsia-500/25 via-violet-500/20 to-sky-400/20 p-5">
                <div><p className="text-sm text-brand-cream/70">{isEnglish ? "Your journey today" : "رحلتك اليوم"}</p><h2 className="mt-1 text-2xl font-black text-brand-gold">{isEnglish ? "3 gentle steps" : "3 خطوات لطيفة"}</h2></div><span className="text-5xl" aria-hidden="true">🪁</span>
              </div>
              <div className="mt-4 grid gap-3">
                {[isEnglish ? "Read a short story" : "اقرأ قصة قصيرة", isEnglish ? "Learn one value" : "تعلّم قيمة واحدة", isEnglish ? "Play a 3-minute round" : "العب جولة من 3 دقائق"].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-2xl border border-brand-cream/10 bg-black/15 p-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-gold text-sm font-black text-black">{index + 1}</span><span className="text-sm font-semibold text-brand-cream/85">{step}</span><span className="mr-auto text-brand-emerald">✓</span></div>)}
              </div>
              <p className="mt-4 text-center text-xs leading-6 text-brand-cream/55">{isEnglish ? "You can stop whenever you like. Enjoyable learning matters more than speed." : "يمكنك التوقف متى شئت. التعلم الممتع أهم من السرعة."}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-14 py-12 md:py-16">
        <section aria-labelledby="journeys-heading" className="space-y-5">
          <div><p className="text-sm font-bold text-brand-emerald">{isEnglish ? "A simple choice" : "اختيار بسيط"}</p><h2 id="journeys-heading" className="mt-2 text-3xl font-black text-brand-cream">{isEnglish ? "What would you like to do today?" : "ما الذي تحب أن تفعله اليوم؟"}</h2></div>
          <div className="grid gap-4 md:grid-cols-3">{journeys.map((journey) => <Link key={journey.titleAr} href={journey.href} className="group"><Card className={`h-full border-brand-cream/10 bg-gradient-to-br ${journey.color} p-6 transition duration-200 hover:-translate-y-1 hover:border-brand-gold/50`}><span className="text-4xl" aria-hidden="true">{journey.icon}</span><h3 className="mt-5 text-xl font-bold text-brand-gold">{isEnglish ? journey.titleEn : journey.titleAr}</h3><p className="mt-2 leading-8 text-brand-cream/70">{isEnglish ? journey.descriptionEn : journey.descriptionAr}</p><span className="mt-5 inline-block text-sm font-bold text-brand-cream underline decoration-brand-gold/50 underline-offset-4 group-hover:text-brand-gold">{isEnglish ? "Open path →" : "افتح المسار ←"}</span></Card></Link>)}</div>
        </section>

        <section id="learning" aria-labelledby="learning-heading" className="space-y-5 scroll-mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-brand-emerald">{isEnglish ? "Age-appropriate content" : "محتوى مناسب للعمر"}</p><h2 id="learning-heading" className="mt-2 text-3xl font-black text-brand-cream">{isEnglish ? "Learn together" : "نتعلم معًا"}</h2></div><Link href="/kids/adventures" className="text-sm font-bold text-brand-gold underline underline-offset-4">{isEnglish ? "All activities →" : "كل الأنشطة ←"}</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{featuredContent.map((item) => <Link key={item.slug} href={`/kids/${item.slug}`} className="group"><Card className="h-full border-brand-cream/10 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-brand-emerald/50"><div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-emerald/10 text-2xl" aria-hidden="true">{contentTypeIcons[item.type] ?? "✨"}</span><span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold">{typeLabels[item.type as keyof typeof typeLabels] ?? (isEnglish ? "Activity" : "نشاط")}</span></div><h3 className="mt-5 text-xl font-bold text-brand-cream group-hover:text-brand-gold">{isEnglish ? item.title_en : item.title_ar}</h3><p className="mt-2 line-clamp-3 text-sm leading-7 text-brand-cream/65">{isEnglish ? (item.content_en?.split("\n")[0] ?? "English content is not available for this activity yet.") : (item.content_ar?.split("\n")[0] ?? "نشاط تعليمي قصير وممتع.")}</p><p className="mt-4 text-sm font-bold text-brand-emerald">{isEnglish ? "Age " : "مناسب لعمر "} {item.age_group} {isEnglish ? "years" : "سنوات"} ←</p></Card></Link>)}</div>
        </section>

        <section aria-labelledby="games-heading" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-brand-emerald">{isEnglish ? "Purposeful play" : "لعب هادف"}</p><h2 id="games-heading" className="mt-2 text-3xl font-black text-brand-cream">{isEnglish ? "Games that build your skills" : "ألعاب تنمي مهاراتك"}</h2><p className="mt-2 max-w-2xl leading-7 text-brand-cream/60">{isEnglish ? "Explore movement, memory, learning, adventure, kindness, and creativity." : "اكتشف ألعاب الحركة والذاكرة والتعلم والمغامرة والقيم والإبداع."}</p></div><Link href="/kids/games" className="text-sm font-bold text-brand-gold underline underline-offset-4">{isEnglish ? "Explore all 12 games →" : "اكتشف الألعاب الـ12 ←"}</Link></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredGames.map((game) => <Link key={game.id} href={"/kids/" + game.id} className="group block h-full"><Card className="h-full overflow-hidden border-brand-cream/10 bg-white/[.04] transition duration-200 hover:-translate-y-1 hover:border-brand-gold/50 hover:bg-brand-gold/[.04]"><div className="relative aspect-[2/1] overflow-hidden border-b border-brand-cream/10"><KidsGameArt gameId={game.id} /><span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-[#061b24]/85 px-3 py-1 text-xs font-bold text-brand-cream backdrop-blur">{isEnglish ? game.categoryEn : game.category}</span></div><div className="p-5"><h3 className="text-lg font-black text-brand-cream transition group-hover:text-brand-gold">{isEnglish ? game.titleEn : game.titleAr}</h3><p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-brand-cream/65">{isEnglish ? game.descriptionEn : game.descriptionAr}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-brand-cream/10 pt-3"><span className="text-xs text-brand-emerald">{isEnglish ? game.skillEn : game.skillAr}</span><span className="text-xs text-brand-cream/50">{game.durationMinutes} {isEnglish ? "min" : "دقائق"}</span></div><span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-gold">{isEnglish ? "Play this game" : "ابدأ اللعبة"} <span aria-hidden="true">{isEnglish ? "→" : "←"}</span></span></div></Card></Link>)}</div>
        </section>

        <section className="rounded-[2rem] border border-brand-gold/20 bg-gradient-to-l from-brand-gold/10 via-brand-emerald/5 to-transparent p-6 text-center md:p-10"><p className="text-4xl" aria-hidden="true">🌟</p><h2 className="mt-3 text-2xl font-black text-brand-gold">{isEnglish ? "Every attempt is progress" : "كل محاولة تقدم صغير"}</h2><p className="mx-auto mt-3 max-w-2xl leading-8 text-brand-cream/70">{isEnglish ? "Play here for learning and joy. Encourage your child to explore, take breaks when needed, and celebrate small steps together." : "اللعب هنا للتعلم والفرح. شجّع طفلك على التجربة، وخذوا استراحة عندما تحتاجون، واحتفلوا بالخطوات الصغيرة معًا."}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/kids/progress" className="rounded-xl border border-brand-emerald/40 px-5 py-3 text-sm font-bold text-brand-emerald transition hover:border-brand-gold hover:text-brand-gold">{isEnglish ? "View progress" : "شاهد التقدم"}</Link><Link href="/kids/achievements" className="rounded-xl border border-brand-gold/40 px-5 py-3 text-sm font-bold text-brand-gold transition hover:bg-brand-gold hover:text-black">{isEnglish ? "Badges & achievements" : "الشارات والإنجازات"}</Link></div></section>
      </Container>
    </main>
  );
}

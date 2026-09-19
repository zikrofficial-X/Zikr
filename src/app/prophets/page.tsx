export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { getProphets } from '@/features/prophets/services/prophets';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'قصص الأنبياء والرسل',
  description: 'قصص الأنبياء والرسل عليهم السلام كاملة — من آدم إلى محمد ﷺ — مع تفاصيل حياتهم ومعجزاتهم وإمكانية مشاهدة الفيديوهات.',
  path: '/prophets',
});

interface Prophet {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  bio_ar: string | null;
  order_num: number | null;
  quran_mentions?: number;
  story_chars?: number;
  story_sections?: number;
}

// Merge the full local index with Supabase so a transient database failure
// never hides the 25-prophet catalogue from the public page.
const PROPHET_SLUG_ALIASES: Record<string, string> = {
  dhulkifl: 'dhul-kifl',
  zakariyya: 'zakariya',
};

function canonicalProphetSlug(slug: string) {
  return PROPHET_SLUG_ALIASES[slug] ?? slug;
}

export default async function ProphetsPage() {
  let displayProphets: Prophet[] = (await getProphets()).map((prophet) => ({
    id: prophet.id,
    name_ar: prophet.nameAr,
    name_en: prophet.nameEn ?? null,
    slug: prophet.slug,
    bio_ar: prophet.bioAr ?? null,
    order_num: prophet.orderNum ?? null,
    quran_mentions: undefined,
    story_chars: 0,
    story_sections: 0,
  }));

  try {
    const supabase = await createClient();
    const prophetIds = displayProphets.map((prophet) => prophet.id).filter(Boolean);
    if (prophetIds.length > 0) {
      const { data: sectionRows } = await supabase
        .from('prophet_sections')
        .select('prophet_id, content_ar')
        .in('prophet_id', prophetIds);
      const stats = new Map<string, { chars: number; sections: number }>();
      for (const row of sectionRows ?? []) {
        const current = stats.get(row.prophet_id) ?? { chars: 0, sections: 0 };
        current.chars += (row.content_ar ?? '').length;
        current.sections += 1;
        stats.set(row.prophet_id, current);
      }
      displayProphets = displayProphets.map((prophet) => ({
        ...prophet,
        story_chars: stats.get(prophet.id)?.chars ?? 0,
        story_sections: stats.get(prophet.id)?.sections ?? 0,
      }));
    }
  } catch {
    // Local feature-owned catalogue remains available when the optional stats query is unavailable.
  }

  // Prophet era colors for visual variety
  const eraColors = [
    'from-amber-900/40 to-yellow-900/40 border-amber-700/30',
    'from-emerald-900/40 to-teal-900/40 border-emerald-700/30',
    'from-sky-900/40 to-blue-900/40 border-sky-700/30',
    'from-rose-900/40 to-pink-900/40 border-rose-700/30',
    'from-violet-900/40 to-purple-900/40 border-violet-700/30',
  ];

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2A1E] to-[#071A13] py-20 text-center">
        <div className="absolute inset-0 pointer-events-none select-none opacity-10">
          <div className="absolute top-8 left-1/4 w-px h-32 bg-brand-gold rotate-12" />
          <div className="absolute bottom-8 right-1/3 w-px h-24 bg-brand-gold -rotate-12" />
        </div>
        <Container className="relative space-y-6">
          <p className="text-brand-gold/60 text-sm tracking-widest font-arabic">﴿ وَكُلًّا نَّقُصُّ عَلَيْكَ مِنْ أَنبَاءِ الرُّسُلِ ﴾</p>
          <h1 className="text-5xl md:text-6xl font-bold text-brand-gold font-arabic leading-tight">
            قصص الأنبياء والرسل
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-8 text-brand-cream/70">
            خمسة وعشرون نبياً ورسولاً ذُكروا في القرآن الكريم — قصصهم كاملة مع التفاصيل والمعجزات والمواقف العظيمة
          </p>
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-gold">25</p>
              <p className="text-xs text-brand-cream/50">نبياً ورسولاً</p>
            </div>
            <div className="w-px h-10 bg-brand-gold/20" />
            <div>
              <p className="text-3xl font-bold text-brand-gold">6236</p>
              <p className="text-xs text-brand-cream/50">آية قرآنية</p>
            </div>
            <div className="w-px h-10 bg-brand-gold/20" />
            <div>
              <p className="text-3xl font-bold text-brand-gold">950+</p>
              <p className="text-xs text-brand-cream/50">سنة دعوة نوح ﷺ</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 space-y-8">
        {/* Prophet Cards Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayProphets.map((prophet, i) => {
            const colorClass = eraColors[i % eraColors.length];
            const initials = prophet.name_ar.slice(0, 2);
            return (
              <Link
                key={prophet.id}
                href={`/prophets/${canonicalProphetSlug(prophet.slug)}`}
                className="group block"
              >
                <div className={`h-full rounded-xl border bg-gradient-to-br ${colorClass} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-gold/10 hover:border-brand-gold/40`}>
                  <div className="flex items-start gap-4 mb-3">
                    {/* Order number + avatar */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full bg-brand-gold/10 border-2 border-brand-gold/30 flex items-center justify-center group-hover:border-brand-gold/60 transition-colors">
                        <span className="text-brand-gold font-bold text-lg font-arabic">{initials}</span>
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0A2A1E] border border-brand-gold/40 flex items-center justify-center text-[9px] text-brand-gold/70 font-bold">
                        {prophet.order_num ?? i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-brand-gold leading-snug">{prophet.name_ar}</h2>
                      {prophet.name_en && (
                        <p className="text-xs text-brand-cream/40 mt-0.5" dir="ltr">{prophet.name_en}</p>
                      )}
                      {prophet.quran_mentions != null && prophet.quran_mentions > 0 && (
                        <Badge variant="outline" className="mt-1.5 text-[10px] border-brand-gold/30 text-brand-gold/70">
                          ذُكر {prophet.quran_mentions} مرة في القرآن
                        </Badge>
                      )}
                    </div>
                  </div>
                  {prophet.bio_ar && (
                    <p className="text-sm leading-relaxed text-brand-cream/70 line-clamp-2 mt-2">
                      {prophet.bio_ar}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-brand-cream/55">
                    <span className="rounded-full border border-brand-gold/20 px-2 py-1 text-brand-gold/75">
                      القصة القرآنية كاملة
                    </span>
                    {(prophet.story_sections ?? 0) > 0 && (
                      <span>{prophet.story_sections} أقسام · {(prophet.story_chars ?? 0).toLocaleString('ar-EG')} حرف</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-brand-gold/50 group-hover:text-brand-gold/80 transition-colors">
                    <span>اقرأ القصة كاملة</span>
                    <span>←</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Closing Quran verse */}
        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-4 mt-8">
          <p className="text-2xl font-arabic leading-loose text-brand-cream" dir="rtl">
            ﴿ تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ مِّنْهُم مَّن كَلَّمَ اللَّهُ وَرَفَعَ بَعْضَهُمْ دَرَجَاتٍ ﴾
          </p>
          <p className="text-brand-gold/60 text-sm">سورة البقرة — الآية 253</p>
        </section>
      </Container>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { pageMetadata } from "@/lib/site";
import { getBattles, getCanonicalBattleSlug } from "@/features/battles/services/battles";

export const metadata: Metadata = pageMetadata({
  title: "غزوات النبي ﷺ",
  description:
    "فهرس الغزوات والحملات الواردة في مكتبة ذِكر مع التواريخ والمواقع والمحطات التعليمية المتاحة.",
  path: "/battles",
});

export const revalidate = 3600;

export default async function BattlesPage() {
  const battles = await getBattles();

  return (
    <main className="min-h-screen" dir="rtl">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1a0a0a] via-[#0A2A1E] to-[#071A13] py-20 text-center">
        <Container className="relative space-y-6">
          <p className="font-arabic text-sm tracking-widest text-brand-gold/60">
            ﴿ كَمْ مِّن فِئَةٍ قَلِيلَةٍ غَلَبَتْ فِئَةً كَثِيرَةً بِإِذْنِ اللَّهِ ﴾
          </p>
          <h1 className="font-arabic text-5xl font-bold leading-tight text-brand-gold md:text-6xl">
            غزوات النبي ﷺ
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-brand-cream/70">
            فهرس زمني للمادة المنشورة، مع التفريق بين السرد التعليمي والمصدر
            التاريخي عند توفر بياناته.
          </p>
          <div className="flex justify-center">
            <div>
              <p className="text-3xl font-bold text-brand-gold">
                {battles.length.toLocaleString("ar-EG")}
              </p>
              <p className="text-xs text-brand-cream/50">
                سجلًا متاحًا في الكتالوج
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-8 py-12">
        {battles.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {battles.map((battle, index) => (
              <Link
                key={battle.id}
                href={"/battles/" + getCanonicalBattleSlug(battle.slug)}
                className="group block"
              >
                <article className="h-full rounded-xl border border-brand-gold/10 bg-gradient-to-br from-red-950/30 to-[#0A2A1E]/80 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-brand-gold/40 hover:shadow-xl hover:shadow-red-900/10">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-gold/20 bg-brand-gold/10 text-sm font-bold text-brand-gold">
                      {battle.order_num ?? index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-bold leading-snug text-brand-gold">
                        {battle.name_ar}
                      </h2>
                      {battle.name_en && (
                        <p className="mt-0.5 text-xs text-brand-cream/35" dir="ltr">
                          {battle.name_en}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-brand-cream/50">
                    {battle.date_hijri && <span>{battle.date_hijri}</span>}
                    {battle.location_ar && <span>• {battle.location_ar}</span>}
                  </div>

                  {battle.description_ar && (
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-brand-cream/70">
                      {battle.description_ar}
                    </p>
                  )}

                  <div className="mt-4 text-xs text-brand-gold/60 transition-colors group-hover:text-brand-gold/90">
                    اقرأ التفاصيل ←
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
            <h2 className="text-xl font-bold text-brand-gold">
              لا توجد سجلات منشورة حاليًا
            </h2>
            <p className="mt-3 text-sm leading-7 text-brand-cream/60">
              تعذر تحميل كتالوج الغزوات. حاول فتح الصفحة مرة أخرى.
            </p>
          </section>
        )}

        <section className="space-y-4 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
          <p className="font-arabic text-2xl leading-loose text-brand-cream">
            ﴿ يَا أَيُّهَا الَّذِينَ آمَنُوا إِن تَنصُرُوا اللَّهَ يَنصُرْكُمْ وَيُثَبِّتْ أَقْدَامَكُمْ ﴾
          </p>
          <p className="text-sm text-brand-gold/60">سورة محمد — الآية 7</p>
        </section>
      </Container>
    </main>
  );
}

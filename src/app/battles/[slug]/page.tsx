import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/lib/site";
import {
  getBattleBySlug,
  getBattles,
  getCanonicalBattleSlug,
} from "@/features/battles/services/battles";

export const revalidate = 3600;

export async function generateStaticParams() {
  const battles = await getBattles();
  return battles
    .filter((battle) => battle.slug)
    .map((battle) => ({ slug: battle.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = getCanonicalBattleSlug(slug);
  const result = await getBattleBySlug(canonicalSlug);

  return pageMetadata({
    title: result?.battle.name_ar ?? "غزوة",
    description:
      result?.battle.description_ar?.slice(0, 160) ??
      "بيانات ومحطات تعليمية من كتالوج الغزوات في منصة ذِكر.",
    path: `/battles/${canonicalSlug}`,
    noindex: !result,
  });
}

const EVENT_LABELS: Record<string, string> = {
  context: "السياق",
  preparation: "الاستعداد",
  battle: "الأحداث",
  story: "الأحداث",
  "turning-point": "التحول",
  outcome: "النتيجة",
  miracle: "الجانب الإيماني",
  lessons: "الدروس والعبر",
  lesson: "الدروس والعبر",
};

export default async function BattleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = getCanonicalBattleSlug(slug);

  if (canonicalSlug !== slug) {
    redirect(`/battles/${canonicalSlug}`);
  }

  const result = await getBattleBySlug(slug);
  if (!result) notFound();

  const { battle, events } = result;

  return (
    <main className="min-h-screen" dir="rtl">
      <section className="bg-gradient-to-b from-[#1a0505] via-[#0A2A1E] to-[#071A13] py-16">
        <Container className="max-w-4xl space-y-6">
          <Link
            href="/battles"
            className="inline-flex items-center gap-2 text-sm text-brand-gold/60 transition-colors hover:text-brand-gold"
          >
            <span aria-hidden="true">←</span>
            <span>العودة إلى الغزوات</span>
          </Link>

          <div className="space-y-3">
            <h1 className="font-arabic text-5xl font-bold leading-tight text-brand-gold md:text-6xl">
              {battle.name_ar}
            </h1>

            {battle.name_en && (
              <p className="text-lg text-brand-cream/45" dir="ltr">
                {battle.name_en}
              </p>
            )}

            <div className="flex flex-wrap gap-2 text-sm text-brand-cream/60">
              {battle.date_hijri && (
                <span className="rounded-full border border-brand-gold/15 px-3 py-1">
                  {battle.date_hijri}
                </span>
              )}
              {battle.date_gregorian && (
                <span className="rounded-full border border-brand-gold/15 px-3 py-1">
                  {battle.date_gregorian}
                </span>
              )}
              {battle.location_ar && (
                <span className="rounded-full border border-brand-gold/15 px-3 py-1">
                  {battle.location_ar}
                </span>
              )}
            </div>
          </div>

          {battle.description_ar && (
            <Card className="border-brand-gold/20 bg-black/20">
              <p className="text-base leading-9 text-brand-cream/80">
                {battle.description_ar}
              </p>
            </Card>
          )}
        </Container>
      </section>

      <Container className="max-w-4xl space-y-8 py-10">
        {events.length > 0 ? (
          <section className="space-y-5" aria-labelledby="battle-events">
            <div>
              <h2
                id="battle-events"
                className="text-2xl font-bold text-brand-gold"
              >
                المحطات والأحداث
              </h2>
              <p className="mt-2 text-sm leading-7 text-brand-cream/55">
                يعرض هذا القسم المحتوى الموجود في الكتالوج المنشور، مع الحفاظ
                على ترتيبه ونوع كل محطة.
              </p>
            </div>

            {events.map((event, index) => (
              <Card
                key={event.id}
                className="space-y-4 border-brand-gold/10 bg-black/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/20 bg-brand-gold/10 text-xs font-bold text-brand-gold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-brand-gold">
                      {event.title_ar}
                    </h3>
                    {event.event_type && EVENT_LABELS[event.event_type] && (
                      <span className="mt-1 inline-block text-xs text-brand-gold/55">
                        {EVENT_LABELS[event.event_type]}
                      </span>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap pr-11 leading-9 text-brand-cream/80">
                  {event.content_ar}
                </p>
              </Card>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
            <h2 className="text-xl font-bold text-brand-gold">
              لا توجد محطات منشورة إضافية
            </h2>
            <p className="mt-3 leading-8 text-brand-cream/60">
              تتوفر البيانات التعريفية فقط في الوقت الحالي، ولن يتم عرض قصة
              مصطنعة بدل المحتوى المنشور.
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-6 text-center">
          <p className="text-sm leading-8 text-brand-cream/60">
            المادة التاريخية في هذا القسم تعليمية، وقد تختلف بعض التفاصيل بين
            المصادر؛ يُنصح بالرجوع إلى كتب السيرة والتاريخ المحققة عند الدراسة.
          </p>
          <Link
            href="/battles"
            className="mt-3 inline-flex text-sm text-brand-gold hover:text-brand-gold/80"
          >
            ← فهرس الغزوات
          </Link>
        </section>
      </Container>
    </main>
  );
}

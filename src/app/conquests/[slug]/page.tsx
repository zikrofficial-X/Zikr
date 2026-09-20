import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/site";
import {
  getConquestBySlug,
  getConquests,
} from "@/features/conquests/services/conquests";

export const revalidate = 3600;

export async function generateStaticParams() {
  const conquests = await getConquests();
  return conquests
    .filter((conquest) => conquest.slug)
    .map((conquest) => ({ slug: conquest.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getConquestBySlug(slug);

  return pageMetadata({
    title: result?.conquest.name_ar ?? "فتح إسلامي",
    description:
      result?.conquest.description_ar?.slice(0, 160) ??
      "بيانات ومحطات تعليمية عن حدث تاريخي من مكتبة ذِكر.",
    path: `/conquests/${slug}`,
    noindex: !result,
  });
}

const EVENT_LABELS: Record<string, string> = {
  context: "السياق",
  campaign: "الحملة",
  transition: "التحول",
  administration: "الإدارة",
  governance: "الإدارة",
  significance: "الأهمية",
  lesson: "دروس تاريخية",
  lessons: "دروس تاريخية",
  battle: "المواجهة",
};

export default async function ConquestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getConquestBySlug(slug);
  if (!result) notFound();

  const { conquest, events } = result;

  return (
    <main className="min-h-screen" dir="rtl">
      <Container className="max-w-4xl space-y-8 py-10">
        <Button href="/conquests" variant="ghost">
          ← العودة إلى الفتوحات
        </Button>

        <Card className="space-y-6">
          <div className="flex items-center gap-4 border-b border-brand-gold/10 pb-6">
            <div className="text-4xl" aria-hidden="true">
              🏰
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-brand-gold">
                {conquest.name_ar}
              </h1>
              {conquest.name_en && (
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                  {conquest.name_en}
                </p>
              )}
            </div>
          </div>

          {conquest.description_ar && (
            <section aria-labelledby="conquest-summary" className="space-y-2">
              <h2
                id="conquest-summary"
                className="text-xl font-semibold text-brand-gold"
              >
                نبذة عن الحدث
              </h2>
              <p className="whitespace-pre-wrap leading-8 text-foreground">
                {conquest.description_ar}
              </p>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {conquest.date_hijri && (
              <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4">
                <p className="text-xs font-semibold uppercase text-brand-gold">
                  التاريخ الهجري
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {conquest.date_hijri}
                </p>
              </div>
            )}

            {conquest.date_gregorian && (
              <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4">
                <p className="text-xs font-semibold uppercase text-brand-gold">
                  التاريخ الميلادي
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {conquest.date_gregorian}
                </p>
              </div>
            )}

            {conquest.leader_ar && (
              <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-brand-gold">
                  القائد
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {conquest.leader_ar}
                </p>
                {conquest.leader_en && (
                  <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                    {conquest.leader_en}
                  </p>
                )}
              </div>
            )}

            {conquest.location_ar && (
              <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-brand-gold">
                  الموقع
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {conquest.location_ar}
                </p>
                {conquest.location_en && (
                  <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                    {conquest.location_en}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {events.length > 0 ? (
          <section className="space-y-4" aria-labelledby="conquest-events-heading">
            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-gold">التسلسل التاريخي</p>
              <h2
                id="conquest-events-heading"
                className="text-2xl font-bold text-foreground"
              >
                محطات الحدث وآثاره
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                المحطات المعروضة هي المادة الموجودة في الكتالوج المنشور، مع
                التنبيه إلى اختلاف بعض التفاصيل بين المصادر التاريخية.
              </p>
            </div>

            {events.map((event, index) => (
              <Card
                key={event.id}
                className="space-y-3 border-brand-gold/15"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-sm font-bold text-brand-gold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-brand-gold">
                      {event.title_ar}
                    </h3>
                    {event.event_type && EVENT_LABELS[event.event_type] && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {EVENT_LABELS[event.event_type]}
                      </p>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap leading-8 text-foreground">
                  {event.content_ar}
                </p>
              </Card>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
            <h2 className="text-xl font-bold text-brand-gold">
              لا توجد محطات إضافية منشورة
            </h2>
            <p className="mt-3 leading-8 text-brand-cream/60">
              تتوفر حاليًا البيانات التعريفية فقط، ولن يتم إنشاء سرد غير موجود
              في الكتالوج.
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-6 text-center">
          <p className="text-sm leading-8 text-brand-cream/60">
            المادة التاريخية تعليمية، وقد تختلف بعض التفاصيل بين المصادر؛
            يُنصح بالرجوع إلى المراجع المتخصصة عند الدراسة المتعمقة.
          </p>
          <Link
            href="/conquests"
            className="mt-3 inline-flex text-sm text-brand-gold hover:text-brand-gold/80"
          >
            ← فهرس الفتوحات
          </Link>
        </section>
      </Container>
    </main>
  );
}

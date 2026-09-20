import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ContentReferences,
  getContentReferences,
} from "@/components/content/content-references";
import {
  getCompanionBySlug,
  getPublishedCompanions,
} from "@/features/companions/services/companions";
import { pageMetadata } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const companions = await getPublishedCompanions();
  return companions
    .filter((companion) => companion.slug)
    .map((companion) => ({ slug: companion.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const companion = await getCompanionBySlug(slug);

  return pageMetadata({
    title: companion?.name_ar ?? "صحابي",
    description:
      companion?.bio_ar?.slice(0, 160) ??
      "سيرة صحابي ومواقف تعليمية من مكتبة ذِكر.",
    path: `/companions/${slug}`,
    noindex: !companion,
  });
}

export default async function CompanionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const companion = await getCompanionBySlug(slug);

  if (!companion) notFound();

  const references = getContentReferences(companion.metadata);

  return (
    <main className="min-h-screen" dir="rtl">
      <Container className="max-w-4xl space-y-8 py-10">
        <Button href="/companions" variant="ghost">
          ← العودة للصحابة
        </Button>

        <Card className="space-y-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-gold/20 text-3xl"
              aria-hidden="true"
            >
              ⭐
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-brand-gold">
                {companion.name_ar}
              </h1>
              {companion.title_ar && (
                <p className="mt-1 text-emerald-200">{companion.title_ar}</p>
              )}
              {companion.name_en && (
                <p className="mt-1 text-sm text-brand-cream/50" dir="ltr">
                  {companion.name_en}
                </p>
              )}
            </div>
          </div>

          {companion.bio_ar && (
            <section aria-labelledby="companion-bio">
              <h2 id="companion-bio" className="text-lg font-bold text-brand-gold">
                السيرة
              </h2>
              <p className="mt-2 leading-9 text-brand-cream/80">
                {companion.bio_ar}
              </p>
            </section>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {companion.birth_place_ar && (
              <div className="rounded-lg border border-brand-gold/10 p-3">
                <p className="text-xs text-brand-cream/50">مكان الميلاد</p>
                <p className="mt-1 text-sm">{companion.birth_place_ar}</p>
              </div>
            )}
            {companion.death_place_ar && (
              <div className="rounded-lg border border-brand-gold/10 p-3">
                <p className="text-xs text-brand-cream/50">مكان الوفاة</p>
                <p className="mt-1 text-sm">{companion.death_place_ar}</p>
              </div>
            )}
            {companion.death_year && (
              <div className="rounded-lg border border-brand-gold/10 p-3">
                <p className="text-xs text-brand-cream/50">سنة الوفاة</p>
                <p className="mt-1 text-sm">{companion.death_year}</p>
              </div>
            )}
          </div>
        </Card>

        {companion.stories.length > 0 ? (
          <section className="space-y-5" aria-labelledby="companion-stories-title">
            <div>
              <h2
                id="companion-stories-title"
                className="text-2xl font-bold text-brand-gold"
              >
                مواقف وقصص منشورة
              </h2>
              <p className="mt-2 leading-8 text-brand-cream/65">
                تُعرض المواقف بحسب المادة المنشورة في مكتبة ذِكر، مع توضيح المصدر
                والمنهجية عند توفر بيانات المراجعة.
              </p>
            </div>

            {companion.stories.map((story, index) => (
              <Card
                key={story.id}
                className="space-y-4 border-brand-gold/10 bg-black/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/20 bg-brand-gold/10 text-xs font-bold text-brand-gold">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-brand-gold">
                      {story.title_ar}
                    </h3>
                    {story.story_type && (
                      <span className="mt-1 inline-block text-xs text-brand-gold/60">
                        {story.story_type}
                      </span>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap pr-11 leading-9 text-brand-cream/80">
                  {story.content_ar}
                </p>
              </Card>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
            <h2 className="text-xl font-bold text-brand-gold">
              لا توجد مواقف منشورة إضافية حاليًا
            </h2>
            <p className="mt-3 leading-8 text-brand-cream/65">
              تتوفر البيانات التعريفية فقط، ولن نعرض قصة مصطنعة أو غير موجودة في
              الكتالوج المنشور.
            </p>
          </section>
        )}

        <ContentReferences references={references} />

        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-6 text-center">
          <p className="text-sm leading-8 text-brand-cream/65">
            التلخيص التعليمي لا يغني عن الرجوع إلى كتب الحديث والسيرة المحققة عند
            دراسة التفاصيل أو نسبة الأقوال والروايات.
          </p>
          <Link
            href="/companions"
            className="mt-4 inline-flex text-sm font-medium text-brand-gold hover:text-brand-gold/80"
          >
            ← جميع الصحابة
          </Link>
        </section>
      </Container>
    </main>
  );
}

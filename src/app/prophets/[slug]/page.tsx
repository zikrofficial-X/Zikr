import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  ContentReferences,
  getContentReferences,
} from "@/components/content/content-references";
import {
  getProphetBySlug,
  getProphets,
} from "@/features/prophets/services/prophets";
import { pageMetadata } from "@/lib/site";

export const revalidate = 3600;

const LEGACY_PROPHET_SLUG_REDIRECTS: Record<string, string> = {
  "dhul-kifl": "dhulkifl",
  zakariyya: "zakariya",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  story: "القصة",
  biography: "السيرة",
  miracle: "المعجزة",
  lesson: "الدروس والعبر",
  teachings: "الدروس والعبر",
  context: "السياق",
  legacy: "ملاحظات ومراجع",
};

export async function generateStaticParams() {
  const prophets = await getProphets();
  return prophets
    .filter((prophet) => prophet.slug)
    .map((prophet) => ({ slug: prophet.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = LEGACY_PROPHET_SLUG_REDIRECTS[slug];

  if (canonicalSlug) {
    return pageMetadata({
      title: "قصص الأنبياء",
      description: "الانتقال إلى الرابط الأساسي لقصة النبي.",
      path: `/prophets/${canonicalSlug}`,
      noindex: true,
    });
  }

  const prophet = await getProphetBySlug(slug);

  return pageMetadata({
    title: prophet ? `قصة ${prophet.nameAr}` : "قصة نبي",
    description:
      prophet?.bioAr?.slice(0, 160) ??
      "فهرس ومحتوى قصصي منظم عن الأنبياء والرسل عليهم السلام.",
    path: `/prophets/${slug}`,
    noindex: !prophet,
  });
}

export default async function ProphetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = LEGACY_PROPHET_SLUG_REDIRECTS[slug];

  if (canonicalSlug) {
    redirect(`/prophets/${canonicalSlug}`);
  }

  const prophet = await getProphetBySlug(slug);
  if (!prophet) notFound();

  const references = getContentReferences(prophet.metadata);
  const storyCharCount = prophet.sections.reduce(
    (total, section) => total + section.contentAr.length,
    0,
  );
  const storyStatus =
    typeof prophet.metadata?.content_status === "string"
      ? prophet.metadata.content_status
      : prophet.sections.length > 0
        ? "published"
        : "summary_only";

  return (
    <main className="min-h-screen" dir="rtl">
      <section className="bg-gradient-to-b from-[#0A2A1E] to-[#071A13] py-16">
        <Container className="max-w-4xl space-y-6">
          <Link
            href="/prophets"
            className="inline-flex items-center gap-2 text-sm text-brand-gold/60 transition-colors hover:text-brand-gold"
          >
            <span aria-hidden="true">←</span>
            <span>العودة إلى قصص الأنبياء</span>
          </Link>

          <div className="space-y-4">
            {prophet.orderNum && (
              <span className="inline-flex rounded-full border border-brand-gold/20 px-3 py-1 text-xs text-brand-gold/60">
                النبي رقم {prophet.orderNum}
              </span>
            )}

            <h1 className="font-arabic text-5xl font-bold leading-tight text-brand-gold md:text-6xl">
              {prophet.nameAr}
            </h1>

            {prophet.nameEn && (
              <p className="text-xl text-brand-cream/50" dir="ltr">
                {prophet.nameEn}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-brand-gold/30 text-brand-gold/80"
              >
                {prophet.sections.length > 0
                  ? `${prophet.sections.length} أقسام`
                  : "نبذة تعريفية"}
              </Badge>

              {storyCharCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-brand-gold/20 text-brand-gold/65"
                >
                  {storyCharCount.toLocaleString("ar-EG")} حرفًا
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {prophet.birthPlaceAr && (
              <Card className="border-brand-gold/10 bg-black/20 p-5">
                <p className="text-xs text-brand-gold/50">مكان الميلاد / النشأة</p>
                <p className="mt-2 text-sm leading-7 text-brand-cream/80">
                  {prophet.birthPlaceAr}
                </p>
              </Card>
            )}

            {prophet.deathPlaceAr && (
              <Card className="border-brand-gold/10 bg-black/20 p-5">
                <p className="text-xs text-brand-gold/50">مكان الوفاة</p>
                <p className="mt-2 text-sm leading-7 text-brand-cream/80">
                  {prophet.deathPlaceAr}
                </p>
              </Card>
            )}
          </div>

          {prophet.bioAr && (
            <section
              aria-labelledby="prophet-summary"
              className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-6"
            >
              <h2 id="prophet-summary" className="text-lg font-bold text-brand-gold">
                نبذة
              </h2>
              <p className="mt-3 text-base leading-9 text-brand-cream/80">
                {prophet.bioAr}
              </p>
            </section>
          )}

          <section
            aria-labelledby="content-status"
            className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5"
          >
            <h2 id="content-status" className="text-base font-bold text-brand-gold">
              حالة المحتوى
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-brand-cream/65">
              <span className="rounded-full border border-brand-gold/15 px-3 py-1">
                {storyStatus === "published"
                  ? "المحتوى القصصي متاح"
                  : storyStatus === "summary_only"
                    ? "المتاح حاليًا نبذة تعريفية"
                    : "المحتوى مرتبط بسجل النشر والمراجعة"}
              </span>
              <span className="rounded-full border border-brand-gold/15 px-3 py-1">
                المصدر والمراجع معروضة أسفل الصفحة عند توفرها
              </span>
            </div>
          </section>
        </Container>
      </section>

      <Container className="max-w-4xl space-y-8 py-10">
        {prophet.sections.length > 0 ? (
          <section className="space-y-6" aria-labelledby="prophet-story">
            <div>
              <h2 id="prophet-story" className="text-2xl font-bold text-brand-gold">
                القصة والمحتوى
              </h2>
              <p className="mt-2 text-sm leading-7 text-brand-cream/55">
                يعرض المحتوى كما هو محفوظ في الكتالوج المنشور، مع الحفاظ على ترتيب الأقسام
                وعدم دمج النصوص في ملخص واحد.
              </p>
            </div>

            {prophet.sections.map((section, index) => (
              <Card
                key={section.id || `${prophet.id}-section-${index}`}
                className="space-y-4 border-brand-gold/10 bg-black/20 p-7"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/20 bg-brand-gold/10 text-xs font-bold text-brand-gold">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-brand-gold">
                        {section.titleAr}
                      </h3>

                      {section.sectionType &&
                        SECTION_TYPE_LABELS[section.sectionType] && (
                          <span className="rounded-full border border-brand-gold/15 px-2 py-0.5 text-xs text-brand-gold/55">
                            {SECTION_TYPE_LABELS[section.sectionType]}
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                <p className="whitespace-pre-wrap pr-11 text-base leading-9 text-brand-cream/85">
                  {section.contentAr}
                </p>
              </Card>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
            <h2 className="text-2xl font-bold text-brand-gold">
              لا توجد أقسام قصصية منشورة بعد
            </h2>
            <p className="mt-3 text-sm leading-8 text-brand-cream/65">
              تتوفر حاليًا البيانات التعريفية فقط. لن يتم عرض محتوى مُنشأ أو منسوب إلى
              مصادر دينية على أنه قصة كاملة قبل توفره في الكتالوج المنشور.
            </p>
          </section>
        )}

        <ContentReferences references={references} />

        <section className="space-y-4 rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center">
          <p className="font-arabic text-2xl leading-loose text-brand-cream">
            ﴿ تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ ﴾
          </p>
          <p className="text-sm text-brand-gold/60">سورة البقرة — الآية 253</p>

          <Link
            href="/prophets"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-gold transition-colors hover:text-brand-gold/80"
          >
            ← عودة إلى جميع الأنبياء
          </Link>
        </section>
      </Container>
    </main>
  );
}

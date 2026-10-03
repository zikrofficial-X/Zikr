import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDuaBySlug } from '@/features/dua/services/dua';
import type { Dua } from '@/features/dua/types/dua';
import { pageMetadata } from '@/lib/site';
import { getRequestLocale } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

const MIN_PUBLIC_DUA_CHARS = 80;

function hasPublicDuaContent(dua: Dua | null, locale: "ar" | "en"): dua is Dua {
  const text = locale === "en" ? dua?.textEn : dua?.textAr;
  return Boolean(text?.trim() && text.trim().length >= MIN_PUBLIC_DUA_CHARS);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const dua = await getDuaBySlug(slug, locale);

  return pageMetadata({
    title: isEnglish ? (dua?.titleEn ?? 'Dua not found') : (dua?.titleAr ?? 'الدعاء غير موجود'),
    description: isEnglish ? dua?.textEn?.trim().slice(0, 160) || 'A supplication in ZIKR.' : dua?.textAr?.trim().slice(0, 160) || 'دعاء مأثور في منصة ذِكرٌ.',
    path: `/dua/${slug}`,
    noindex: !hasPublicDuaContent(dua, locale),
  });
}

export default async function DuaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const dua = await getDuaBySlug(slug, locale);

  if (!hasPublicDuaContent(dua, locale)) notFound();

  return (
    <Container className="py-12 space-y-8 max-w-2xl" dir={isEnglish ? "ltr" : "rtl"}>
      <nav className="text-sm text-brand-cream/60" aria-label={isEnglish ? "Breadcrumb" : "مسار التنقل"}>
        <Link href="/" className="hover:text-brand-gold">{isEnglish ? "Home" : "الرئيسية"}</Link>
        <span className="mx-2">/</span>
        <Link href="/dua" className="hover:text-brand-gold">{isEnglish ? "Duas" : "الأدعية"}</Link>
        <span className="mx-2">/</span>
        <span>{isEnglish ? dua.titleEn : dua.titleAr}</span>
      </nav>

      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">{isEnglish ? dua.titleEn : dua.titleAr}</h1>
      </header>

      <Card className="p-8 space-y-6 bg-black/30 border-brand-gold/30">
        <div className="space-y-4">
          <p className={`text-2xl leading-relaxed text-brand-cream text-center ${isEnglish ? "" : "font-arabic"}`} dir={isEnglish ? "ltr" : "rtl"}>
            {isEnglish ? dua.textEn : dua.textAr}
          </p>
        </div>
      </Card>

      <section className="space-y-4">
        {!isEnglish && dua.occasionAr && (
          <Card className="p-4 space-y-2 border-brand-gold/20">
            <h2 className="text-lg font-bold text-brand-gold">المناسبة</h2>
            <p className="text-brand-cream/90 leading-7">{dua.occasionAr}</p>
          </Card>
        )}
        {!isEnglish && dua.sourceAr && (
          <Card className="p-4 space-y-2 border-brand-gold/20">
            <h2 className="text-lg font-bold text-brand-gold">المصدر</h2>
            <p className="text-brand-cream/90 leading-7">{dua.sourceAr}</p>
          </Card>
        )}
        {!isEnglish && dua.benefitsAr && (
          <Card className="p-4 space-y-2 border-brand-gold/20">
            <h2 className="text-lg font-bold text-brand-gold">الفوائد</h2>
            <p className="text-brand-cream/90 leading-7">{dua.benefitsAr}</p>
          </Card>
        )}
      </section>

      <Card className="p-6 space-y-4 bg-brand-gold/10 border-brand-gold/20">
        <h2 className="text-xl font-bold text-brand-gold">{isEnglish ? "Virtue of supplication" : "فضل الدعاء"}</h2>
        {isEnglish ? (
          <p className="text-brand-cream/70 text-sm leading-relaxed text-center">
            The English translation of this supporting quotation is not stored in the current canonical content source.
          </p>
        ) : (
          <p className="text-brand-cream/90 font-arabic text-lg leading-relaxed text-center">
            قال رسول الله ﷺ: «الدعاء هو العبادة».
          </p>
        )}
        <div className="text-center">
          <Button href="/dua" variant="secondary">{isEnglish ? "Back to Duas" : "العودة إلى الأدعية"}</Button>
        </div>
      </Card>
    </Container>
  );
}

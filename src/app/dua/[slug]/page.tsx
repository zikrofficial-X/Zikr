import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDuaBySlug } from '@/features/dua/services/dua';
import type { Dua } from '@/features/dua/types/dua';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const revalidate = 1800;

const MIN_PUBLIC_DUA_CHARS = 80;

function hasPublicDuaContent(dua: Dua | null): dua is Dua {
  return Boolean(dua?.textAr?.trim() && dua.textAr.trim().length >= MIN_PUBLIC_DUA_CHARS);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dua = await getDuaBySlug(slug);

  return pageMetadata({
    title: dua?.titleAr ?? 'الدعاء غير موجود',
    description: dua?.textAr?.trim().slice(0, 160) || 'دعاء مأثور في منصة ذِكرٌ.',
    path: `/dua/${slug}`,
    noindex: !hasPublicDuaContent(dua),
  });
}

export default async function DuaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dua = await getDuaBySlug(slug);

  if (!hasPublicDuaContent(dua)) notFound();

  return (
    <Container className="py-12 space-y-8 max-w-2xl">
      <nav className="text-sm text-brand-cream/60" aria-label="مسار التنقل">
        <Link href="/" className="hover:text-brand-gold">الرئيسية</Link>
        <span className="mx-2">/</span>
        <Link href="/dua" className="hover:text-brand-gold">الأدعية</Link>
        <span className="mx-2">/</span>
        <span>{dua.titleAr}</span>
      </nav>

      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">{dua.titleAr}</h1>
        {dua.titleEn && <p className="text-brand-cream/70">{dua.titleEn}</p>}
      </header>

      <Card className="p-8 space-y-6 bg-black/30 border-brand-gold/30">
        <div className="space-y-4">
          <p className="text-2xl font-arabic leading-relaxed text-brand-cream text-center" dir="rtl">
            {dua.textAr}
          </p>
          {dua.textEn && (
            <p className="text-lg text-brand-cream/80 leading-relaxed text-center">{dua.textEn}</p>
          )}
        </div>
      </Card>

      <section className="space-y-4">
        {dua.occasionAr && (
          <Card className="p-4 space-y-2 border-brand-gold/20">
            <h2 className="text-lg font-bold text-brand-gold">المناسبة</h2>
            <p className="text-brand-cream/90 leading-7">{dua.occasionAr}</p>
          </Card>
        )}
        {dua.sourceAr && (
          <Card className="p-4 space-y-2 border-brand-gold/20">
            <h2 className="text-lg font-bold text-brand-gold">المصدر</h2>
            <p className="text-brand-cream/90 leading-7">{dua.sourceAr}</p>
          </Card>
        )}
        {dua.benefitsAr && (
          <Card className="p-4 space-y-2 border-brand-gold/20">
            <h2 className="text-lg font-bold text-brand-gold">الفوائد</h2>
            <p className="text-brand-cream/90 leading-7">{dua.benefitsAr}</p>
          </Card>
        )}
      </section>

      <Card className="p-6 space-y-4 bg-brand-gold/10 border-brand-gold/20">
        <h2 className="text-xl font-bold text-brand-gold">فضل الدعاء</h2>
        <p className="text-brand-cream/90 font-arabic text-lg leading-relaxed text-center">
          قال رسول الله ﷺ: «الدعاء هو العبادة».
        </p>
        <div className="text-center">
          <Button href="/dua" variant="secondary">العودة إلى الأدعية</Button>
        </div>
      </Card>
    </Container>
  );
}

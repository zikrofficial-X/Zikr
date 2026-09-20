export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { getDuaCategories, getDuas } from '@/features/dua/services/dua';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = pageMetadata({
  title: 'الأدعية الإسلامية',
  description: 'مجموعة شاملة من الأدعية القرآنية والنبوية والمأثورة من منصة ذِكر.',
  path: '/dua',
});

export const revalidate = 3600;

export default async function DuaPage() {
  const [duasData, categoriesData] = await Promise.all([
    getDuas(undefined, 50),
    getDuaCategories(),
  ]);

  const displayDuas = duasData;
  const displayCategories = categoriesData;

  return (
    <Container className="py-12 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">الأدعية الإسلامية</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          مجموعة شاملة من الأدعية القرآنية والنبوية والمأثورة لمختلف المناسبات
        </p>
      </section>

      {/* Categories */}
      {displayCategories.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="تصنيفات الأدعية" />
          <div className="flex flex-wrap justify-center gap-3">
            {displayCategories.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border border-brand-gold/30 px-4 py-1.5 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors cursor-pointer"
              >
                {cat.nameAr}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Duas List */}
      <section className="space-y-6">
        <SectionHeader
          title="الأدعية المأثورة"
          subtitle={`${displayDuas.length} دعاء`}
        />

        <div className="grid gap-5">
          {displayDuas.map((dua) => (
            <Link
              key={`${dua.id}-${dua.slug}`}
              href={`/dua/${dua.slug}`}
            >
              <Card className="p-6 space-y-4 hover:border-brand-gold/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-bold text-brand-gold">{dua.titleAr}</h3>
                  {dua.sourceAr && (
                    <Badge variant="outline" className="shrink-0 text-xs">{dua.sourceAr}</Badge>
                  )}
                </div>
                <p
                  className="text-brand-cream/90 text-lg leading-loose font-arabic"
                  dir="rtl"
                >
                  {dua.textAr}
                </p>
                {dua.occasionAr && (
                  <p className="text-sm text-brand-gold/70 border-t border-brand-gold/15 pt-3">
                    <span className="font-semibold">المناسبة: </span>
                    {dua.occasionAr}
                  </p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Quran verse about dua */}
      <section>
        <Card className="p-8 text-center space-y-4 bg-brand-gold/10 border-brand-gold/30">
          <h3 className="text-xl font-bold text-brand-gold">فضل الدعاء</h3>
          <p className="text-brand-cream/90 font-arabic text-xl leading-loose" dir="rtl">
            &quot;وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ&quot;
          </p>
          <p className="text-brand-gold/70 text-sm">سورة غافر - الآية 60</p>
          <div className="border-t border-brand-gold/20 pt-4">
            <p className="text-brand-cream/70 text-sm leading-relaxed">
              قال صلى الله عليه وسلم: &quot;الدُّعَاءُ هُوَ الْعِبَادَةُ&quot; — رواه الترمذي
            </p>
          </div>
        </Card>
      </section>
    </Container>
  );
}

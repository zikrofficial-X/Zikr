'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import type { QuranTafsirSource } from '@/features/quran/types/quran';

const FALLBACK_SOURCE: QuranTafsirSource = {
  author: 'التفسير الجلالين',
  sourceUrl: 'https://api.alquran.cloud/v1/ayah/1:1/ar.jalalayn',
};

export function TafsirLibrary({ sources }: { sources: QuranTafsirSource[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const availableSources = sources.length > 0 ? sources : [FALLBACK_SOURCE];
  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return availableSources;
    return availableSources.filter((source) => source.author.toLowerCase().includes(query));
  }, [availableSources, searchQuery]);

  return (
    <Container className="py-12 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">تفسير القرآن الكريم</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          المصادر الظاهرة هنا هي التفاسير المتاحة فعليًا في قاعدة بيانات ذِكر، ويُعرض التفسير عند فتح الآية داخل القرآن.
        </p>
      </section>

      <section className="flex gap-2">
        <Input
          type="text"
          placeholder="ابحث عن التفسير أو المؤلف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          dir="rtl"
          aria-label="البحث في مصادر التفسير"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filtered.map((source) => (
          <Card key={source.author} className="p-6 space-y-4 hover:border-brand-gold/50 transition-all">
            <h2 className="text-xl font-bold text-brand-gold">{source.author}</h2>
            <p className="text-sm leading-7 arabic-muted">
              هذا المصدر هو النسخة المسجلة والمتاحة داخل خدمة تفسير الآيات في ذِكر.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quran"
                className="flex-1 min-w-40 rounded-lg border border-brand-gold/30 bg-transparent py-2 text-center text-sm text-brand-cream/80 transition-colors hover:border-brand-gold hover:text-brand-gold"
              >
                افتح القرآن والتفسير
              </Link>
              {source.sourceUrl ? (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-40 rounded-lg border border-brand-gold/20 py-2 text-center text-sm text-brand-cream/60 hover:text-brand-gold transition-colors"
                >
                  رابط المصدر
                </a>
              ) : null}
            </div>
          </Card>
        ))}

        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 arabic-muted">
            لم يتم العثور على مصدر بهذا الاسم.
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        <SectionHeader title="معلومة مهمة" />
        <Card className="space-y-4">
          <p className="leading-8 arabic-muted">
            لا تعرض ذِكر أسماء تفاسير لم تُحمّل فعليًا إلى الخدمة. وعند وجود بيانات من قاعدة البيانات، تُقدَّم على أنها المصدر الفعلي بدل الاعتماد على قائمة واجهة ثابتة.
          </p>
          <p className="leading-8 arabic-muted">
            يمكن للمستخدم فتح أي آية من صفحة القرآن لرؤية النص والتفسير المسجل لها مع مصدره متى كان متاحًا.
          </p>
        </Card>
      </section>
    </Container>
  );
}

export default TafsirLibrary;

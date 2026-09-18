'use client';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { useState } from 'react';

export default function TafsirPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const tafsirBooks = [
    { name: 'تفسير ابن كثير', author: 'عماد الدين إسماعيل بن عمر بن كثير', era: 'القرن 8 هـ' },
    { name: 'تفسير الطبري', author: 'محمد بن جرير الطبري', era: 'القرن 3 هـ' },
    { name: 'تفسير القرطبي', author: 'محمد بن أحمد بن أبي بكر القرطبي', era: 'القرن 6 هـ' },
    { name: 'تفسير البيضاوي', author: 'ناصر الدين أبي سعيد عبدالله بن عمر بن محمد الشيرازي', era: 'القرن 7 هـ' },
    { name: 'تفسير الشوكاني', author: 'محمد بن علي بن محمد الشوكاني', era: 'القرن 13 هـ' },
    { name: 'تفسير النسفي', author: 'عبدالله بن أحمد بن محمود النسفي', era: 'القرن 5 هـ' },
  ];

  const filtered = tafsirBooks.filter(book =>
    book.name.includes(searchQuery) || book.author.includes(searchQuery)
  );

  return (
    <Container className="py-12 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">تفسير القرآن الكريم</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          اختر من أشهر التفاسير الإسلامية لفهم آيات القرآن الكريم
        </p>
      </section>

      <section className="flex gap-2">
        <Input
          type="text"
          placeholder="ابحث عن تفسير..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button variant="primary">بحث</Button>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filtered.map((book, idx) => (
          <Card key={idx} className="p-6 space-y-3 hover:border-brand-gold/50 cursor-pointer transition-all">
            <h3 className="text-xl font-bold text-brand-gold">{book.name}</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-brand-cream/60">المؤلف: </span>
                <span className="text-brand-cream">{book.author}</span>
              </p>
              <p>
                <span className="text-brand-cream/60">العصر: </span>
                <span className="text-brand-cream">{book.era}</span>
              </p>
            </div>
            <Link
              href="/quran"
              className="block w-full rounded-lg border border-brand-gold/30 bg-transparent py-2 text-center text-sm text-brand-cream/80 transition-colors hover:border-brand-gold hover:text-brand-gold"
            >
              اقرأ في القرآن
            </Link>
          </Card>
        ))}
      </section>

      <section className="space-y-6">
        <SectionHeader title="معلومات عن التفسير" />
        <Card className="space-y-4">
          <p className="leading-8 arabic-muted">
            التفسير هو شرح آيات القرآن الكريم وبيان معانيها وأحكامها. اعتنى المسلمون بالتفسير منذ عهد النبي صلى الله عليه وسلم والصحابة الكرام.
          </p>
          <p className="leading-8 arabic-muted">
            يمكنك اختيار أي من التفاسير المشهورة للاستفادة من تفسيرات متعددة وآراء علماء مختلفين في فهم كتاب الله عز وجل.
          </p>
        </Card>
      </section>
    </Container>
  );
}

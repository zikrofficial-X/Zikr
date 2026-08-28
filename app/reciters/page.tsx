'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { reciters } from '@/lib/data/content';

export default function RecitersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = reciters.filter(
    (r) =>
      r.nameAr.includes(searchQuery) ||
      r.nameEn.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Container className="py-12 space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">القراء الكرام</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted">
          استمع لأشهر القراء والمقرئين المعروفين بجودة قراءتهم للقرآن الكريم
        </p>
      </section>

      <section className="flex gap-2">
        <Input
          type="text"
          placeholder="ابحث عن قارئ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          dir="rtl"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((reciter) => (
          <Card
            key={reciter.id}
            className="p-6 space-y-4 text-center hover:border-brand-gold/50 transition-all"
          >
            <div
              className="w-14 h-14 rounded-full bg-brand-gold/10 border border-brand-gold/20 mx-auto flex items-center justify-center"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-7 h-7 text-brand-gold/60"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-gold">{reciter.nameAr}</h3>
              <p className="text-sm text-brand-cream/60">{reciter.nameEn}</p>
            </div>
            <Link href={`/reciters/${reciter.id}`}>
              <Button variant="secondary" className="w-full">
                استمع للتلاوات
              </Button>
            </Link>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-8 arabic-muted">
            لم يتم العثور على قارئ بهذا الاسم.
          </div>
        )}
      </section>
    </Container>
  );
}

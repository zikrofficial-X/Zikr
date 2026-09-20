'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getReciters } from '@/features/quran/services/quran';
import type { Reciter } from '@/features/quran/types/quran';
import { surahs as FALLBACK_SURAHS } from '@/features/quran/data/fallback';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuranAudioPlayer } from '@/features/quran/components/audio-player';

const SURAHS = FALLBACK_SURAHS.map((surah) => ({
  number: surah.id,
  nameAr: surah.nameAr,
}));

export default function ReciterPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [reciter, setReciter] = useState<Reciter | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSurah, setCurrentSurah] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    getReciters().then((rows) => {
      if (!active) return;
      setReciter(rows.find((r) => r.id === slug || r.code === slug) ?? null);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-16">
        <Card className="text-center space-y-4 py-12">
          <h1 className="text-2xl text-brand-gold">جاري تحميل بيانات القارئ</h1>
        </Card>
      </Container>
    );
  }

  if (!reciter) {
    return (
      <Container className="py-16">
        <Card className="text-center space-y-4 py-12">
          <h1 className="text-2xl text-brand-gold">القارئ غير موجود</h1>
          <p className="arabic-muted">لم يتم العثور على القارئ المطلوب.</p>
          <Button href="/reciters" variant="secondary">العودة للقراء</Button>
        </Card>
      </Container>
    );
  }

  const filtered = SURAHS.filter((s) => s.nameAr.includes(search));
  return (
    <Container className="py-12 space-y-8">
      {/* Header */}
      <nav className="text-sm arabic-muted">
        <Link href="/reciters" className="hover:text-brand-gold transition-colors">القراء</Link>
        {' / '}
        <span className="text-brand-gold">{reciter.nameAr}</span>
      </nav>

      <section className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-brand-gold/10 border border-brand-gold/30 mx-auto flex items-center justify-center">
          <span className="text-3xl text-brand-gold/70" aria-hidden>&#9670;</span>
        </div>
        <h1 className="text-3xl font-bold text-brand-gold">{reciter.nameAr}</h1>
        <p className="arabic-muted">{reciter.nameEn}</p>
        <Badge variant="secondary">{reciter.type === 'surah' ? 'تلاوة كاملة' : 'تلاوة مقطعية'}</Badge>
      </section>

      {/* Canonical Quran audio */}
      {currentSurah && (
        <QuranAudioPlayer
          surahId={currentSurah}
          initialReciterId={reciter.id}
        />
      )}

      {/* Search surahs */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="ابحث عن سورة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-brand-gold/20 bg-black/20 p-3 text-brand-cream placeholder:text-brand-cream/40 focus:border-brand-gold focus:outline-none"
          dir="rtl"
        />
      </div>

      {/* Surahs grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((surah) => (
          <button
            key={surah.number}
            onClick={() => setCurrentSurah(surah.number)}
            className={`rounded-lg border p-3 text-center text-sm transition-all hover:border-brand-gold/60 hover:bg-brand-gold/5 ${
              currentSurah === surah.number
                ? 'border-brand-gold bg-brand-gold/10 text-brand-gold'
                : 'border-brand-gold/20 text-brand-cream/80'
            }`}
          >
            <span className="block text-xs text-brand-gold/50 mb-1">{surah.number}</span>
            {surah.nameAr}
          </button>
        ))}
      </section>

      <p className="text-center text-xs arabic-muted">
        التلاوات المتاحة عبر مكتبة الصوت الداخلية لمنصة ذِكر. يُعرض المصدر الأصلي في بيانات التسجيل عند توفره.
      </p>
    </Container>
  );
}

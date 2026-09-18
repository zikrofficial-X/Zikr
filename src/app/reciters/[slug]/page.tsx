'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reciters } from '@/lib/data/content';

// Surah numbers 1-114 with Arabic names
const SURAHS = [
  { number: 1, nameAr: 'الفاتحة' }, { number: 2, nameAr: 'البقرة' },
  { number: 3, nameAr: 'آل عمران' }, { number: 4, nameAr: 'النساء' },
  { number: 5, nameAr: 'المائدة' }, { number: 6, nameAr: 'الأنعام' },
  { number: 7, nameAr: 'الأعراف' }, { number: 8, nameAr: 'الأنفال' },
  { number: 9, nameAr: 'التوبة' }, { number: 10, nameAr: 'يونس' },
  { number: 11, nameAr: 'هود' }, { number: 12, nameAr: 'يوسف' },
  { number: 13, nameAr: 'الرعد' }, { number: 14, nameAr: 'إبراهيم' },
  { number: 15, nameAr: 'الحجر' }, { number: 16, nameAr: 'النحل' },
  { number: 17, nameAr: 'الإسراء' }, { number: 18, nameAr: 'الكهف' },
  { number: 19, nameAr: 'مريم' }, { number: 20, nameAr: 'طه' },
  { number: 21, nameAr: 'الأنبياء' }, { number: 22, nameAr: 'الحج' },
  { number: 23, nameAr: 'المؤمنون' }, { number: 24, nameAr: 'النور' },
  { number: 25, nameAr: 'الفرقان' }, { number: 26, nameAr: 'الشعراء' },
  { number: 27, nameAr: 'النمل' }, { number: 28, nameAr: 'القصص' },
  { number: 29, nameAr: 'العنكبوت' }, { number: 30, nameAr: 'الروم' },
  { number: 31, nameAr: 'لقمان' }, { number: 32, nameAr: 'السجدة' },
  { number: 33, nameAr: 'الأحزاب' }, { number: 34, nameAr: 'سبأ' },
  { number: 35, nameAr: 'فاطر' }, { number: 36, nameAr: 'يس' },
  { number: 37, nameAr: 'الصافات' }, { number: 38, nameAr: 'ص' },
  { number: 39, nameAr: 'الزمر' }, { number: 40, nameAr: 'غافر' },
  { number: 41, nameAr: 'فصلت' }, { number: 42, nameAr: 'الشورى' },
  { number: 43, nameAr: 'الزخرف' }, { number: 44, nameAr: 'الدخان' },
  { number: 45, nameAr: 'الجاثية' }, { number: 46, nameAr: 'الأحقاف' },
  { number: 47, nameAr: 'محمد' }, { number: 48, nameAr: 'الفتح' },
  { number: 49, nameAr: 'الحجرات' }, { number: 50, nameAr: 'ق' },
  { number: 51, nameAr: 'الذاريات' }, { number: 52, nameAr: 'الطور' },
  { number: 53, nameAr: 'النجم' }, { number: 54, nameAr: 'القمر' },
  { number: 55, nameAr: 'الرحمن' }, { number: 56, nameAr: 'الواقعة' },
  { number: 57, nameAr: 'الحديد' }, { number: 58, nameAr: 'المجادلة' },
  { number: 59, nameAr: 'الحشر' }, { number: 60, nameAr: 'الممتحنة' },
  { number: 61, nameAr: 'الصف' }, { number: 62, nameAr: 'الجمعة' },
  { number: 63, nameAr: 'المنافقون' }, { number: 64, nameAr: 'التغابن' },
  { number: 65, nameAr: 'الطلاق' }, { number: 66, nameAr: 'التحريم' },
  { number: 67, nameAr: 'الملك' }, { number: 68, nameAr: 'القلم' },
  { number: 69, nameAr: 'الحاقة' }, { number: 70, nameAr: 'المعارج' },
  { number: 71, nameAr: 'نوح' }, { number: 72, nameAr: 'الجن' },
  { number: 73, nameAr: 'المزمل' }, { number: 74, nameAr: 'المدثر' },
  { number: 75, nameAr: 'القيامة' }, { number: 76, nameAr: 'الإنسان' },
  { number: 77, nameAr: 'المرسلات' }, { number: 78, nameAr: 'النبأ' },
  { number: 79, nameAr: 'النازعات' }, { number: 80, nameAr: 'عبس' },
  { number: 81, nameAr: 'التكوير' }, { number: 82, nameAr: 'الانفطار' },
  { number: 83, nameAr: 'المطففين' }, { number: 84, nameAr: 'الانشقاق' },
  { number: 85, nameAr: 'البروج' }, { number: 86, nameAr: 'الطارق' },
  { number: 87, nameAr: 'الأعلى' }, { number: 88, nameAr: 'الغاشية' },
  { number: 89, nameAr: 'الفجر' }, { number: 90, nameAr: 'البلد' },
  { number: 91, nameAr: 'الشمس' }, { number: 92, nameAr: 'الليل' },
  { number: 93, nameAr: 'الضحى' }, { number: 94, nameAr: 'الشرح' },
  { number: 95, nameAr: 'التين' }, { number: 96, nameAr: 'العلق' },
  { number: 97, nameAr: 'القدر' }, { number: 98, nameAr: 'البينة' },
  { number: 99, nameAr: 'الزلزلة' }, { number: 100, nameAr: 'العاديات' },
  { number: 101, nameAr: 'القارعة' }, { number: 102, nameAr: 'التكاثر' },
  { number: 103, nameAr: 'العصر' }, { number: 104, nameAr: 'الهمزة' },
  { number: 105, nameAr: 'الفيل' }, { number: 106, nameAr: 'قريش' },
  { number: 107, nameAr: 'الماعون' }, { number: 108, nameAr: 'الكوثر' },
  { number: 109, nameAr: 'الكافرون' }, { number: 110, nameAr: 'النصر' },
  { number: 111, nameAr: 'المسد' }, { number: 112, nameAr: 'الإخلاص' },
  { number: 113, nameAr: 'الفلق' }, { number: 114, nameAr: 'الناس' },
];

function getAudioUrl(baseUrlTemplate: string, surahNumber: number): string {
  const paddedNumber = String(surahNumber).padStart(3, '0');
  return `${baseUrlTemplate}/${paddedNumber}.mp3`;
}

export default function ReciterPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const reciter = reciters.find((r) => r.id === slug || r.code === slug);

  const [currentSurah, setCurrentSurah] = useState<number | null>(null);
  const [search, setSearch] = useState('');

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
  const audioUrl = currentSurah ? getAudioUrl(reciter.baseUrlTemplate, currentSurah) : null;

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

      {/* Now playing */}
      {audioUrl && currentSurah && (
        <Card className="space-y-3 border-brand-gold/40">
          <p className="text-sm arabic-muted text-center">
            يُشغّل الآن: سورة {SURAHS.find((s) => s.number === currentSurah)?.nameAr}
          </p>
          <audio
            key={audioUrl}
            controls
            autoPlay
            className="w-full"
            aria-label={`تلاوة سورة ${SURAHS.find((s) => s.number === currentSurah)?.nameAr} بصوت ${reciter.nameAr}`}
          >
            <source src={audioUrl} type="audio/mpeg" />
            المتصفح لا يدعم تشغيل الصوت.
          </audio>
        </Card>
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
        مصدر التلاوات:{' '}
        <a
          href="https://www.mp3quran.net"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-gold/70 hover:underline"
        >
          mp3quran.net
        </a>
      </p>
    </Container>
  );
}

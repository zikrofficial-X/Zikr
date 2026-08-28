'use client';

import { useLanguage } from '@/components/layout/language-provider';
import { QuranAuthBanner } from '@/components/quran/quran-auth-banner';

export function QuranPageHeader() {
  const { isEnglish, dir } = useLanguage();
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h1 className="text-4xl font-bold text-brand-gold" dir={dir}>
        {isEnglish ? 'The Holy Quran' : 'القرآن الكريم'}
      </h1>
      <QuranAuthBanner />
    </div>
  );
}

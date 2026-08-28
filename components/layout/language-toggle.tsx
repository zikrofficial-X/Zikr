'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from './language-provider';

export function LanguageToggle() {
  const { locale, toggleLocale, isEnglish } = useLanguage();
  const nextLabel = isEnglish ? 'العربية' : 'English';

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={isEnglish ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-gold/20 bg-black/20 px-3 py-2 text-xs font-semibold text-brand-cream/70 transition-all hover:border-brand-gold/45 hover:bg-brand-gold/10 hover:text-brand-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span>{nextLabel}</span>
      <span className="rounded-full bg-brand-gold/15 px-1.5 py-0.5 text-[10px] uppercase text-brand-gold/80">{locale}</span>
    </button>
  );
}

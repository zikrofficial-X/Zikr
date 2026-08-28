'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, localeMeta, type Locale } from '@/lib/i18n';

type LanguageContextValue = {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  isEnglish: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default locale consistently for both server and client
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // After hydration, update to stored locale if available
    setIsHydrated(true);
    const storedLocale = getStoredLocale();
    if (storedLocale !== DEFAULT_LOCALE) {
      setLocaleState(storedLocale);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    
    const meta = localeMeta[locale];
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.dir;
    document.documentElement.dataset.locale = locale;
    document.body.dir = meta.dir;

    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Storage can be unavailable in private/restricted browser contexts.
    }
  }, [locale, isHydrated]);

  const value = useMemo<LanguageContextValue>(() => {
    const dir = localeMeta[locale].dir;
    return {
      locale,
      dir,
      isEnglish: locale === 'en',
      setLocale: setLocaleState,
      toggleLocale: () => setLocaleState((current) => (current === 'ar' ? 'en' : 'ar')),
    };
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

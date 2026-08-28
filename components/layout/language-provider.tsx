'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, localeMeta, type Locale } from '@/lib/i18n';
import { getOfflinePreference, saveOfflinePreference } from '@/lib/offline-settings';

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
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const storedLocale = getStoredLocale();
      if (storedLocale !== DEFAULT_LOCALE) {
        if (!cancelled) setLocaleState(storedLocale);
      } else {
        const durableLocale = await getOfflinePreference<Locale>(LOCALE_STORAGE_KEY);
        if (!cancelled && isLocale(durableLocale)) setLocaleState(durableLocale);
      }
      if (!cancelled) setIsHydrated(true);
    };

    void restore();
    return () => {
      cancelled = true;
    };
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
      // IndexedDB remains the durable fallback when Web Storage is restricted.
    }
    void saveOfflinePreference(LOCALE_STORAGE_KEY, locale);
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

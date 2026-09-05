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

type LanguageProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

const LOCALE_COOKIE = 'zikr-locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

export function LanguageProvider({ children, initialLocale = DEFAULT_LOCALE }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      // The server cookie is the authoritative first-render locale. Only fall
      // back to legacy browser storage when no persisted locale has reached
      // the server yet, preserving backward compatibility for existing users.
      const hasServerLocale = initialLocale !== DEFAULT_LOCALE;
      if (!hasServerLocale) {
        const storedLocale = getStoredLocale();
        if (storedLocale !== DEFAULT_LOCALE) {
          if (!cancelled) setLocaleState(storedLocale);
        } else {
          const durableLocale = await getOfflinePreference<Locale>(LOCALE_STORAGE_KEY);
          if (!cancelled && isLocale(durableLocale)) setLocaleState(durableLocale);
        }
      }
      if (!cancelled) setIsHydrated(true);
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [initialLocale]);

  useEffect(() => {
    if (!isHydrated) return;

    const meta = localeMeta[locale];
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.dir;
    document.documentElement.dataset.locale = locale;
    document.body.dir = meta.dir;

    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
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

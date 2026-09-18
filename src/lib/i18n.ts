export type Locale = 'ar' | 'en';

export const DEFAULT_LOCALE: Locale = 'ar';
export const LOCALE_STORAGE_KEY = 'zikr-locale';

export const localeMeta: Record<Locale, { label: string; nativeLabel: string; dir: 'rtl' | 'ltr'; lang: string }> = {
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', lang: 'ar' },
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr', lang: 'en' },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'ar' || value === 'en';
}

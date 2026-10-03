export type Locale = "ar" | "en";

export type Direction = "rtl" | "ltr";

export type LocalizedValue = {
  ar?: string | null;
  en?: string | null;
};

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_STORAGE_KEY = "zikr-locale";
export const LOCALE_COOKIE = "zikr-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const localeMeta: Record<
  Locale,
  { label: string; nativeLabel: string; dir: Direction; lang: string; htmlLocale: string }
> = {
  ar: {
    label: "Arabic",
    nativeLabel: "العربية",
    dir: "rtl",
    lang: "ar",
    htmlLocale: "ar-SA",
  },
  en: {
    label: "English",
    nativeLabel: "English",
    dir: "ltr",
    lang: "en",
    htmlLocale: "en-US",
  },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en";
}

export function normalizeLocale(value: unknown): Locale {
  return value === "en" ? "en" : "ar";
}

/**
 * Select the localized value without ever leaking Arabic into the English UI.
 *
 * English intentionally returns null when an English translation is missing.
 * Callers can then decide whether the content should be hidden, flagged for
 * translation, or replaced with a dedicated English fallback.
 */
export function pickLocalized(
  locale: Locale,
  values: LocalizedValue,
): string | null {
  const ar = values.ar?.trim() || null;
  const en = values.en?.trim() || null;

  if (locale === "en") return en;
  return ar;
}

export function requireLocalized(
  locale: Locale,
  values: LocalizedValue,
): string {
  return pickLocalized(locale, values) ?? "";
}

export function getLocaleDirection(locale: Locale): Direction {
  return localeMeta[locale].dir;
}

export function formatLocaleNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeMeta[locale].htmlLocale, options).format(value);
}

export function formatLocaleDate(
  value: string | number | Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(localeMeta[locale].htmlLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(new Date(value));
}

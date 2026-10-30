const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/gu;
const ALEF_VARIANTS = /[أإآٱ]/gu;
const YA_VARIANTS = /[ىئ]/gu;

/**
 * Search-only normalization. Never use this value for rendering Quran,
 * Hadith, or any source text. It mirrors private.normalize_arabic_search_text
 * in the active Supabase schema.
 */
export function normalizeArabicSearchText(value: string): string {
  return value
    .toLocaleLowerCase("ar")
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(ALEF_VARIANTS, "ا")
    .replace(YA_VARIANTS, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/[ـ\s]+/gu, " ")
    .trim();
}

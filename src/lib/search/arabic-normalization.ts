const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/gu;
const ALEF_VARIANTS = /[أإآٱ]/gu;
const YA_VARIANTS = /[ىئ]/gu;

/**
 * Normalizes Arabic text for search only. Displayed Quran/Hadith text is never
 * modified. The same transformations are implemented by the Supabase search
 * migration so local and database search return consistent results.
 */
export function normalizeArabicSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(ALEF_VARIANTS, "ا")
    .replace(YA_VARIANTS, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/[ـ\s]+/gu, " ")
    .trim()
    .toLocaleLowerCase("ar");
}

/**
 * Normalizes Arabic search input so diacritics, tatweel, and common alef
 * variants do not prevent a child from finding a game by its displayed name.
 */
export function normalizeKidsGameSearch(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

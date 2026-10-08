export type NarrationQualityResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  wordCount: number;
  arabicRatio: number;
};

const ARABIC_LETTER = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u;

export function normalizeNarrationText(value: string) {
  return value
    .normalize("NFC")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u200B-\u200D\u200E\u200F\u2060\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function evaluateArabicNarrationText(value: string, category: string): NarrationQualityResult {
  const text = normalizeNarrationText(value);
  const errors: string[] = [];
  const warnings: string[] = [];
  const letters = [...text].filter((char) => /\p{L}/u.test(char));
  const arabicLetters = letters.filter((char) => ARABIC_LETTER.test(char)).length;
  const arabicRatio = letters.length ? arabicLetters / letters.length : 0;
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  if (text.length < 8) errors.push("Narration text is too short.");
  if (text.length > 5000) errors.push("Narration text exceeds the production safety limit.");
  if (arabicRatio < 0.55 && category !== "other") errors.push("Arabic narration text has an unexpectedly low Arabic-letter ratio.");
  if (/[<>]/u.test(text)) errors.push("Narration contains markup characters.");
  if (/[!؟?]{3,}|[.…]{4,}|،،+/u.test(text)) warnings.push("Narration contains repeated punctuation that may sound unnatural.");
  if (/https?:\/\//i.test(text)) errors.push("Narration must not speak a raw URL.");
  if (/\b(يا رب|قال الله|قال رسول الله|رسول الله)\b/u.test(text) && category === "other") {
    warnings.push("General editorial text contains religious attribution terms; verify source locking before publishing.");
  }

  return { ok: errors.length === 0, errors, warnings, wordCount, arabicRatio };
}

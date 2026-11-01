import type { PaginationMeta } from "@/lib/types/common";

export interface HadithBook {
  id: string;
  slug?: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  available: number;
}

export interface Hadith {
  number: number;
  arab?: string;
  english?: string;
  id?: string;
  contentLocale?: "ar" | "en";
}

export type HadithDisplay = {
  text: string;
  contentLocale: "ar" | "en";
  usedArabicFallback: boolean;
};

export function resolveHadithDisplay(hadith: Hadith, requestedLocale: "ar" | "en"): HadithDisplay {
  if (requestedLocale === "en" && hadith.english?.trim()) {
    return { text: hadith.english, contentLocale: "en", usedArabicFallback: false };
  }
  return {
    text: hadith.arab ?? "",
    contentLocale: "ar",
    usedArabicFallback: requestedLocale === "en",
  };
}

export interface HadithResponse<T> {
  name: string;
  slug: string;
  total: number;
  pagination?: PaginationMeta;
  data: T;
}

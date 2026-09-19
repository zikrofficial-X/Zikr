"use server";

import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import type { Surah, Ayah, Reciter } from "@/features/quran/types/quran";
import {
  mapDbSurah,
  mapDbAyah,
  mapDbReciter,
  type DbSurah,
  type DbAyah,
  type DbReciter,
  type DbTafsir,
  type Locale,
} from "./quran";

const quranDbRequest = <T>(path: string) =>
  supabaseServerAnonRequest<T>(path, { timeoutMs: 15_000 });

/**
 * DB-First Quran Service (Server-Only)
 * This module interacts directly with Supabase REST API.
 */

export async function getAllSurahsFromDb(
  locale: Locale = "ar"
): Promise<Surah[] | null> {
  try {
    const dbSurahs = await quranDbRequest<DbSurah[]>(
      "/rest/v1/quran_surahs?select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count&order=id.asc"
    );

    if (!dbSurahs?.length) return null;
    return dbSurahs.map(surah => mapDbSurah(surah, locale));
  } catch (error) {
    console.error("[quran-server] getAllSurahsFromDb failed:", error);
    return null;
  }
}

export async function getSurahMetaFromDb(
  surahId: number,
  locale: Locale = "ar"
): Promise<Surah | null> {
  try {
    const dbSurahs = await quranDbRequest<DbSurah[]>(
      `/rest/v1/quran_surahs?id=eq.${surahId}&select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count&limit=1`
    );
    return dbSurahs?.[0] ? mapDbSurah(dbSurahs[0], locale) : null;
  } catch (error) {
    console.error(
      `[quran-server] getSurahMetaFromDb failed for ${surahId}:`,
      error
    );
    return null;
  }
}

export async function getSurahFromDb(
  surahId: number,
  locale: Locale = "ar"
): Promise<{ surah: Surah; ayahs: Ayah[] } | null> {
  try {
    // 1. Get Surah Metadata
    const dbSurahs = await quranDbRequest<DbSurah[]>(
      `/rest/v1/quran_surahs?id=eq.${surahId}&select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count`
    );

    if (!dbSurahs?.[0]) return null;

    // 2. Get Ayahs for this Surah
    const dbAyahs = await quranDbRequest<DbAyah[]>(
      `/rest/v1/quran_ayahs?surah_id=eq.${surahId}&select=id,surah_id,ayah_number,text_ar,text_en,text_uthmani,text_simple,page,juz,hizb,rub,sajda&order=ayah_number.asc`
    );

    return {
      surah: mapDbSurah(dbSurahs[0], locale),
      ayahs: (dbAyahs ?? []).map(ayah => mapDbAyah(ayah, locale)),
    };
  } catch (error) {
    console.error(
      `[quran-server] getSurahFromDb failed for ${surahId}:`,
      error
    );
    return null;
  }
}

export async function getAyahFromDb(
  surahId: number,
  ayahNumber: number,
  locale: Locale = "ar"
): Promise<Ayah | null> {
  try {
    const result = await quranDbRequest<DbAyah[]>(
      `/rest/v1/quran_ayahs?surah_id=eq.${surahId}&ayah_number=eq.${ayahNumber}&limit=1&select=id,surah_id,ayah_number,text_ar,text_en,text_uthmani,text_simple,page,juz,hizb,rub,sajda`
    );

    if (!result?.[0]) return null;
    return mapDbAyah(result[0], locale);
  } catch (error) {
    console.error(
      `[quran-server] getAyahFromDb failed for ${surahId}:${ayahNumber}:`,
      error
    );
    return null;
  }
}

export type QuranTafsirRecord = DbTafsir & {
  author: string | null;
  source_url: string | null;
  retrieved_at: string | null;
};

export async function getTafsirRecordFromDb(
  surahId: number,
  ayahNumber: number
): Promise<QuranTafsirRecord | null> {
  try {
    const result = await quranDbRequest<QuranTafsirRecord[]>(
      `/rest/v1/quran_tafsir?surah_id=eq.${surahId}&ayah_number=eq.${ayahNumber}&order=author.asc&limit=1&select=tafsir_ar,tafsir_en,author,source_url,retrieved_at`
    );
    return result?.[0] ?? null;
  } catch (error) {
    console.error(
      `[quran-server] getTafsirRecordFromDb failed for ${surahId}:${ayahNumber}:`,
      error
    );
    return null;
  }
}

export async function getTafsirFromDb(
  surahId: number,
  ayahNumber: number
): Promise<string | null> {
  const record = await getTafsirRecordFromDb(surahId, ayahNumber);
  return record?.tafsir_ar ?? null;
}

export type QuranTafsirSource = {
  author: string;
  sourceUrl: string | null;
};

export async function getTafsirSourcesFromDb(): Promise<QuranTafsirSource[]> {
  try {
    const rows = await quranDbRequest<Array<{ author: string | null; source_url: string | null }>>(
      "/rest/v1/quran_tafsir?select=author,source_url&order=author.asc&limit=200"
    );

    const byAuthor = new Map<string, QuranTafsirSource>();
    for (const row of rows ?? []) {
      const author = row.author?.trim();
      if (!author || byAuthor.has(author)) continue;
      byAuthor.set(author, { author, sourceUrl: row.source_url ?? null });
    }
    return [...byAuthor.values()];
  } catch (error) {
    console.error("[quran-server] getTafsirSourcesFromDb failed:", error);
    return [];
  }
}

export async function getRecitersFromDb(): Promise<Reciter[] | null> {
  try {
    const dbReciters = await quranDbRequest<DbReciter[]>(
      "/rest/v1/quran_reciters?select=id,code,name_ar,name_en,base_url_template&order=name_en.asc"
    );

    if (!dbReciters?.length) return null;
    return dbReciters.map(mapDbReciter);
  } catch (error) {
    console.error("[quran-server] getRecitersFromDb failed:", error);
    return null;
  }
}

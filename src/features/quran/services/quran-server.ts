import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  supabaseServerAdminRequest,
  supabaseServerAnonRequest,
} from "@/lib/supabase/server";
import type { Surah, Ayah, Reciter, QuranTafsirSource } from "@/features/quran/types/quran";
import { surahs as fallbackSurahs } from "@/features/quran/data/fallback";
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

/** Prefer the server-only read path, then retain anon access for local previews. */
const quranDbRequest = async <T>(path: string): Promise<T> => {
  try {
    return await supabaseServerAdminRequest<T>(path, {
      timeoutMs: 15_000,
      retries: 1,
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
  } catch (adminError) {
    console.warn("[quran-server] admin read unavailable; trying public read:", adminError);
    return supabaseServerAnonRequest<T>(path, {
      timeoutMs: 15_000,
      retries: 1,
      cache: "force-cache",
      next: { revalidate: 86400 },
    });
  }
};

type LocalQuranRow = {
  id: string;
  surah_id: number;
  ayah_number: number;
  text_ar: string;
  text_en: string | null;
  text_uthmani: string | null;
  text_simple: string | null;
  page: number | null;
  juz: number | null;
  hizb: number | null;
  rub: number | null;
  sajda: boolean | null;
};

let localCorpusPromise: Promise<LocalQuranRow[]> | null = null;

async function loadLocalQuranCorpus(): Promise<LocalQuranRow[]> {
  if (!localCorpusPromise) {
    localCorpusPromise = readFile(
      path.join(process.cwd(), "public/quran/mushaf-hafs.json"),
      "utf8",
    ).then((raw) => {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length !== 6236) {
        throw new Error(
          `Local Quran corpus is invalid: expected 6236 ayahs, received ${Array.isArray(parsed) ? parsed.length : 0}`,
        );
      }
      return parsed as LocalQuranRow[];
    });
  }

  return localCorpusPromise;
}

const BASMALA_PREFIXES = [
  "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
];

function getDisplayedLocalArabicText(row: LocalQuranRow): string {
  let text = row.text_uthmani ?? row.text_ar;
  if (row.ayah_number === 1 && row.surah_id !== 1 && row.surah_id !== 9) {
    for (const prefix of BASMALA_PREFIXES) {
      if (text.startsWith(prefix)) {
        text = text.slice(prefix.length).trim();
        break;
      }
    }
  }
  return text;
}

function mapLocalAyah(
  row: LocalQuranRow,
  locale: Locale,
): Ayah {
  const displayArabic = getDisplayedLocalArabicText(row);
  return mapDbAyah(
    {
      id: row.id,
      surah_id: row.surah_id,
      ayah_number: row.ayah_number,
      text_ar: displayArabic,
      text_en: row.text_en,
      text_uthmani: displayArabic,
      text_simple: row.text_simple,
      page: row.page,
      juz: row.juz,
      hizb: row.hizb,
      rub: row.rub,
      sajda: row.sajda,
    },
    locale,
  );
}

async function getLocalSurahRows(surahId: number): Promise<LocalQuranRow[]> {
  const corpus = await loadLocalQuranCorpus();
  const rows = corpus
    .filter((row) => row.surah_id === surahId)
    .sort((a, b) => a.ayah_number - b.ayah_number);

  if (!rows.length) return [];
  return rows;
}

function getFallbackSurahs(locale: Locale): Surah[] {
  return fallbackSurahs.map((surah) => ({
    number: surah.id,
    name: locale === "en" ? surah.nameEn : surah.nameAr,
    englishName: surah.nameEn,
    englishNameTranslation: surah.nameEn,
    revelationType: surah.revelationPlace === "medinan" ? "Medinan" : "Meccan",
    numberOfAyahs: surah.ayahCount,
  }));
}

/**
 * Local-corpus-first Quran Service (Server-Only)
 * The complete Quran corpus is tracked in Git and deployed with the app.
 * Supabase remains a compatibility fallback for exceptional legacy states.
 */

export async function getAllSurahsFromDb(
  locale: Locale = "ar"
): Promise<Surah[] | null> {
  try {
    const corpus = await loadLocalQuranCorpus();
    const counts = new Map<number, number>();
    for (const row of corpus) {
      counts.set(row.surah_id, (counts.get(row.surah_id) ?? 0) + 1);
    }
    if (counts.size === 114 && corpus.length === 6236) {
      return getFallbackSurahs(locale).map((surah) => ({
        ...surah,
        numberOfAyahs: counts.get(surah.number) ?? surah.numberOfAyahs,
      }));
    }
  } catch (error) {
    console.error("[quran-server] local Quran corpus unavailable; falling back to Supabase:", error);
  }

  try {
    const dbSurahs = await quranDbRequest<DbSurah[]>(
      "/rest/v1/quran_surahs?select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count&order=id.asc"
    );

    if (dbSurahs?.length !== 114) {
      console.error(`[quran-server] Incomplete Quran catalog: ${dbSurahs?.length ?? 0}/114`);
      return getFallbackSurahs(locale);
    }
    return dbSurahs.map(surah => mapDbSurah(surah, locale));
  } catch (error) {
    console.error("[quran-server] canonical Supabase surah catalog unavailable:", error);
    return getFallbackSurahs(locale);
  }
}

export async function getSurahMetaFromDb(
  surahId: number,
  locale: Locale = "ar"
): Promise<Surah | null> {
  try {
    const rows = await getLocalSurahRows(surahId);
    const fallback = getFallbackSurahs(locale).find((surah) => surah.number === surahId) ?? null;
    if (fallback && rows.length) {
      return { ...fallback, numberOfAyahs: rows.length };
    }
  } catch (error) {
    console.error(`[quran-server] local metadata failed for ${surahId}:`, error);
  }

  try {
    const dbSurahs = await quranDbRequest<DbSurah[]>(
      `/rest/v1/quran_surahs?id=eq.${surahId}&select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count&limit=1`
    );
    if (dbSurahs?.[0]) return mapDbSurah(dbSurahs[0], locale);
    return getFallbackSurahs(locale).find((surah) => surah.number === surahId) ?? null;
  } catch (error) {
    console.error(
      `[quran-server] getSurahMetaFromDb failed for ${surahId}:`,
      error
    );
    return getFallbackSurahs(locale).find((surah) => surah.number === surahId) ?? null;
  }
}

export async function getSurahFromDb(
  surahId: number,
  locale: Locale = "ar"
): Promise<{ surah: Surah; ayahs: Ayah[] } | null> {
  try {
    const rows = await getLocalSurahRows(surahId);
    const fallback = getFallbackSurahs(locale).find((surah) => surah.number === surahId) ?? null;
    if (fallback && rows.length === fallback.numberOfAyahs) {
      return {
        surah: { ...fallback, numberOfAyahs: rows.length },
        ayahs: rows.map((row) => mapLocalAyah(row, locale)),
      };
    }
  } catch (error) {
    console.error(`[quran-server] local Quran surah ${surahId} unavailable:`, error);
  }

  try {
    const dbSurahs = await quranDbRequest<DbSurah[]>(
      `/rest/v1/quran_surahs?id=eq.${surahId}&select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count`
    );
    if (!dbSurahs?.[0]) return null;

    const dbAyahs = await quranDbRequest<DbAyah[]>(
      `/rest/v1/quran_ayahs?surah_id=eq.${surahId}&select=id,surah_id,ayah_number,text_ar,text_en,text_uthmani,text_simple,page,juz,hizb,rub,sajda&order=ayah_number.asc`
    );

    return {
      surah: mapDbSurah(dbSurahs[0], locale),
      ayahs: (dbAyahs ?? []).map(ayah => mapDbAyah(ayah, locale)),
    };
  } catch (error) {
    console.error(`[quran-server] canonical Supabase surah ${surahId} unavailable:`, error);
    return null;
  }
}

export async function searchLocalQuran(
  query: string,
  locale: Locale = "ar",
): Promise<Ayah[]> {
  const cleanQuery = query.trim().toLocaleLowerCase();
  if (!cleanQuery) return [];

  try {
    const corpus = await loadLocalQuranCorpus();
    return corpus
      .filter((row) => {
        const candidates = [
          getDisplayedLocalArabicText(row),
          row.text_ar,
          row.text_simple ?? "",
          row.text_uthmani ?? "",
          row.text_en ?? "",
        ];
        return candidates.some((value) =>
          value.toLocaleLowerCase().includes(cleanQuery),
        );
      })
      .slice(0, 50)
      .map((row) => mapLocalAyah(row, locale));
  } catch (error) {
    console.error("[quran-server] Local Quran search unavailable:", error);
    return [];
  }
}

export async function getAyahFromDb(
  surahId: number,
  ayahNumber: number,
  locale: Locale = "ar"
): Promise<Ayah | null> {
  try {
    const rows = await getLocalSurahRows(surahId);
    const local = rows.find((row) => row.ayah_number === ayahNumber);
    if (local) return mapLocalAyah(local, locale);
  } catch (error) {
    console.error(
      `[quran-server] local Quran ayah ${surahId}:${ayahNumber} unavailable:`,
      error
    );
  }

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

type LocalTafsirRow = {
  surah_id: number;
  ayah_number: number;
  tafsir_ar: string;
  tafsir_en: string | null;
  author: string | null;
};

let localTafsirPromise: Promise<LocalTafsirRow[]> | null = null;

async function loadLocalTafsir(): Promise<LocalTafsirRow[]> {
  if (!localTafsirPromise) {
    localTafsirPromise = readFile(
      path.join(process.cwd(), "public/offline-content/v1/tafsir.json"),
      "utf8",
    ).then((raw) => {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error("Local tafsir corpus is invalid.");
      }
      return parsed as LocalTafsirRow[];
    });
  }

  return localTafsirPromise;
}

export type QuranTafsirRecord = DbTafsir & {
  author: string | null;
  source_url: string | null;
  retrieved_at: string | null;
};

export async function getTafsirRecordFromDb(
  surahId: number,
  ayahNumber: number,
): Promise<QuranTafsirRecord | null> {
  try {
    const local = await loadLocalTafsir();
    const localRecord = local.find(
      (row) =>
        row.surah_id === surahId &&
        row.ayah_number === ayahNumber &&
        Boolean(row.tafsir_ar?.trim()),
    );

    if (localRecord) {
      return {
        tafsir_ar: localRecord.tafsir_ar,
        tafsir_en: localRecord.tafsir_en,
        author: localRecord.author,
        source_url: null,
        retrieved_at: null,
      };
    }
  } catch (error) {
    console.error(
      `[quran-server] Local tafsir unavailable for ${surahId}:${ayahNumber}:`,
      error,
    );
  }

  try {
    const result = await quranDbRequest<QuranTafsirRecord[]>(
      `/rest/v1/quran_tafsir?surah_id=eq.${surahId}&ayah_number=eq.${ayahNumber}&order=author.asc&limit=1&select=tafsir_ar,tafsir_en,author,source_url,retrieved_at`,
    );
    return result?.[0] ?? null;
  } catch (error) {
    console.error(
      `[quran-server] getTafsirRecordFromDb failed for ${surahId}:${ayahNumber}:`,
      error,
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


export async function getTafsirSourcesFromDb(): Promise<QuranTafsirSource[]> {
  try {
    const local = await loadLocalTafsir();
    const byAuthor = new Map<string, QuranTafsirSource>();

    for (const row of local) {
      const author = row.author?.trim();
      if (!author || byAuthor.has(author)) continue;
      byAuthor.set(author, { author, sourceUrl: null });
    }

    if (byAuthor.size > 0) return [...byAuthor.values()];
  } catch (error) {
    console.error("[quran-server] Local tafsir source catalogue unavailable:", error);
  }

  try {
    const rows = await quranDbRequest<
      Array<{ author: string | null; source_url: string | null }>
    >(
      "/rest/v1/quran_tafsir?select=author,source_url&order=author.asc&limit=200",
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


export type QuranAudioRecord = {
  audio_url: string | null;
  source_url: string | null;
  retrieved_at: string | null;
  storage_url: string | null;
  storage_status: "pending" | "uploading" | "ready" | "failed" | null;
  storage_path: string | null;
};

export async function getQuranAudioFromDb(
  surahId: number,
  reciterCode: string,
): Promise<
  | { audio: QuranAudioRecord; reason?: undefined; storage_path?: undefined }
  | { audio: null; reason: string; storage_path: string | null }
> {
  const candidates = [...new Set([
    reciterCode,
    reciterCode.replace(/^ar\./i, ""),
    `ar.${reciterCode.replace(/^ar\./i, "")}`,
  ])];

  try {
    const reciters = await quranDbRequest<Array<{
      id: string;
      code: string | null;
      base_url_template: string | null;
    }>>(
      `/rest/v1/quran_reciters?select=id,code,base_url_template&code=in.(${candidates.map((value) => encodeURIComponent(value)).join(",")})&limit=10`,
    );
    const reciterRow = reciters?.find(
      (row) => typeof row.code === "string" && candidates.includes(row.code),
    );
    if (!reciterRow?.id) {
      return { audio: null, reason: "reciter_not_found", storage_path: null };
    }

    const audio = await quranDbRequest<QuranAudioRecord[]>(
      `/rest/v1/quran_audio?surah_id=eq.${surahId}&reciter_id=eq.${encodeURIComponent(reciterRow.id)}&select=audio_url,source_url,retrieved_at,storage_url,storage_status,storage_path&limit=1`,
    );
    const row = audio?.[0] ?? null;

    if (row?.storage_status === "ready" && row.storage_url) {
      return {
        audio: {
          ...row,
          audio_url: row.storage_url,
        },
      };
    }

    // Supabase Storage is an optional cache.  The canonical Quran audio
    // records retain a verified external source URL, so playback continues
    // to work on the Free plan after the oversized local cache is removed.
    // `source_url` is the provider homepage; `audio_url` is the playable file
    // URL. Prefer the file URL whenever the Storage cache is unavailable.
    const storedUrl = row?.audio_url;
    const isSupabaseStorageUrl =
      typeof storedUrl === "string" &&
      storedUrl.includes(".supabase.co/storage/v1/object/");
    const externalUrl =
      !isSupabaseStorageUrl && storedUrl
        ? storedUrl
        : reciterRow.base_url_template
          ? `${reciterRow.base_url_template.replace(/\/$/, "")}/${String(surahId).padStart(3, "0")}.mp3`
          : row?.source_url;
    if (externalUrl && /^https?:\/\//i.test(externalUrl)) {
      return {
        audio: {
          ...row,
          audio_url: externalUrl,
        },
      };
    }

    return {
      audio: null,
      reason: row?.storage_status ?? "not_imported",
      storage_path: row?.storage_path ?? null,
    };
  } catch (error) {
    console.error(
      `[quran-server] getQuranAudioFromDb failed for ${surahId}/${reciterCode}:`,
      error,
    );
    return { audio: null, reason: "storage_unavailable", storage_path: null };
  }
}

import { getPublicEnv } from "@/lib/env";
import type { Ayah, Juz, Surah, Reciter } from "@/features/quran/types/quran";
import { getCanonicalAyahCount } from "@/features/quran/utils/surah-mapping";

const DEBUG_QURAN = process.env.NODE_ENV !== "production";

function debugLog(message: string, payload?: unknown) {
  if (!DEBUG_QURAN) return;
  if (payload === undefined) {
    console.debug(`[quran-service] ${message}`);
    return;
  }
  console.debug(`[quran-service] ${message}`, payload);
}

export type Locale = "ar" | "en" | "tafsir";

export type DbSurah = {
  id: number;
  name_ar: string;
  name_en: string;
  name_translation: string | null;
  revelation_place: string | null;
  ayahs_count: number;
};

export type DbAyah = {
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

export type DbTafsir = {
  tafsir_ar: string;
  tafsir_en: string | null;
};

export type DbReciter = {
  id: string;
  name_ar: string;
  name_en: string;
  code: string;
  base_url_template: string;
};

export function mapDbReciter(reciter: DbReciter): Reciter {
  return {
    // Keep the stable database UUID as the UI value. The API resolves
    // the UUID/code pair against the canonical quran_reciters table.
    id: reciter.id,
    nameAr: reciter.name_ar,
    nameEn: reciter.name_en,
    code: reciter.code,
    baseUrlTemplate: reciter.base_url_template,
    type: "surah",
  };
}

export function mapDbSurah(surah: DbSurah, locale: Locale): Surah {
  return {
    number: surah.id,
    name: locale === "en" ? surah.name_en : surah.name_ar,
    englishName: surah.name_en,
    englishNameTranslation: surah.name_translation ?? "",
    numberOfAyahs:
      surah.ayahs_count && surah.ayahs_count > 0
        ? surah.ayahs_count
        : getCanonicalAyahCount(surah.id),
    revelationType: surah.revelation_place ?? "",
  };
}

export function mapDbAyah(ayah: DbAyah, locale: Locale): Ayah {
  return {
    number: ayah.ayah_number,
    text: locale === "en" ? ayah.text_en ?? ayah.text_ar : ayah.text_ar,
    numberInSurah: ayah.ayah_number,
    juz: ayah.juz ?? 0,
    manzil: 0,
    page: ayah.page ?? 0,
    ruku: 0,
    hizbQuarter: ayah.hizb ?? 0,
    sajda: ayah.sajda ?? false,
  };
}

function getSupabaseConfig() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase public configuration is missing.");
  }
  return {
    url: NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, ""),
    key: NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

async function supabasePublicFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
    headers: {
      Accept: "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase Quran request failed: ${response.status} ${body}`);
  }

  return (await response.json()) as T;
}

export async function getAllSurahs(locale: Locale = "ar"): Promise<Surah[]> {
  try {
    debugLog("getAllSurahs from Supabase");
    const rows = await supabasePublicFetch<DbSurah[]>(
      "/rest/v1/quran_surahs?select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count&order=id.asc",
    );
    if (rows.length !== 114) {
      throw new Error(`Canonical Quran catalog must contain 114 surahs, received ${rows.length}`);
    }
    return rows.map(row => mapDbSurah(row, locale));
  } catch (error) {
    console.error("[quran-service] canonical Supabase surah catalog unavailable:", error);
    return [];
  }
}

export async function getSurahById(
  id: number,
  locale: Locale = "ar",
): Promise<{ surah: Surah; ayahs: Ayah[] } | null> {
  if (!Number.isInteger(id) || id < 1 || id > 114) return null;

  try {
    const [surahs, ayahs] = await Promise.all([
      supabasePublicFetch<DbSurah[]>(
        `/rest/v1/quran_surahs?id=eq.${id}&select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count&limit=1`,
      ),
      supabasePublicFetch<DbAyah[]>(
        `/rest/v1/quran_ayahs?surah_id=eq.${id}&select=id,surah_id,ayah_number,text_ar,text_en,text_uthmani,text_simple,page,juz,hizb,rub,sajda&order=ayah_number.asc`,
      ),
    ]);

    if (!surahs[0]) return null;
    if (ayahs.length !== mapDbSurah(surahs[0], "ar").numberOfAyahs) {
      throw new Error(`Incomplete Quran surah ${id}: expected ${surahs[0].ayahs_count}, received ${ayahs.length}`);
    }

    return {
      surah: mapDbSurah(surahs[0], locale),
      ayahs: ayahs.map(row => mapDbAyah(row, locale)),
    };
  } catch (error) {
    console.error(`[quran-service] Supabase surah ${id} unavailable:`, error);
    return null;
  }
}

export async function getAyah(
  surahId: number,
  ayahId: number,
  locale: Locale = "ar",
): Promise<Ayah | null> {
  if (surahId < 1 || surahId > 114 || ayahId < 1) return null;

  try {
    const rows = await supabasePublicFetch<DbAyah[]>(
      `/rest/v1/quran_ayahs?surah_id=eq.${surahId}&ayah_number=eq.${ayahId}&limit=1&select=id,surah_id,ayah_number,text_ar,text_en,text_uthmani,text_simple,page,juz,hizb,rub,sajda`,
    );
    return rows[0] ? mapDbAyah(rows[0], locale) : null;
  } catch (error) {
    console.error(`[quran-service] Supabase ayah ${surahId}:${ayahId} unavailable:`, error);
    return null;
  }
}

export async function getTafsir(
  surahId: number,
  ayahId: number,
): Promise<string | null> {
  if (surahId < 1 || surahId > 114 || ayahId < 1) return null;

  try {
    const rows = await supabasePublicFetch<DbTafsir[] & Array<{ author?: string | null }>>(
      `/rest/v1/quran_tafsir?surah_id=eq.${surahId}&ayah_number=eq.${ayahId}&order=author.asc&limit=1&select=tafsir_ar,tafsir_en,author`,
    );
    return rows[0]?.tafsir_ar ?? null;
  } catch (error) {
    console.error(`[quran-service] Supabase tafsir ${surahId}:${ayahId} unavailable:`, error);
    return null;
  }
}

export async function getJuz(
  juzId: number,
  locale: Locale = "ar",
): Promise<Juz | null> {
  if (juzId < 1 || juzId > 30) return null;

  try {
    const [ayahRows, surahRows] = await Promise.all([
      supabasePublicFetch<DbAyah[]>(
        `/rest/v1/quran_ayahs?juz=eq.${juzId}&select=id,surah_id,ayah_number,text_ar,text_en,text_uthmani,text_simple,page,juz,hizb,rub,sajda&order=surah_id.asc,ayah_number.asc`,
      ),
      supabasePublicFetch<DbSurah[]>(
        "/rest/v1/quran_surahs?select=id,name_ar,name_en,name_translation,revelation_place,ayahs_count&order=id.asc",
      ),
    ]);

    const ayahs = ayahRows.map(row => mapDbAyah(row, locale));
    const surahs: Record<string, Surah> = {};
    const included = new Set(ayahRows.map(row => row.surah_id));
    for (const row of surahRows) {
      if (included.has(row.id)) surahs[String(row.id)] = mapDbSurah(row, locale);
    }

    return {
      number: juzId,
      ayahs,
      surahs,
      edition: {
        identifier: "zikr.supabase.quran",
        language: "ar",
        name: "القرآن الكريم",
        englishName: "The Noble Quran",
      },
    };
  } catch (error) {
    console.error(`[quran-service] Supabase juz ${juzId} unavailable:`, error);
    return null;
  }
}

export async function searchQuran(
  query: string,
  locale: Locale = "ar",
): Promise<Ayah[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    const encoded = encodeURIComponent(cleanQuery.replace(/[%_]/g, " "));
    const rows = await supabasePublicFetch<DbAyah[]>(
      `/rest/v1/quran_ayahs?or=(text_ar.ilike.*${encoded}*,text_uthmani.ilike.*${encoded}*,text_simple.ilike.*${encoded}*)&limit=50&order=surah_id.asc,ayah_number.asc&select=id,surah_id,ayah_number,text_ar,text_en,text_uthmani,text_simple,page,juz,hizb,rub,sajda`,
    );
    return rows.map(row => mapDbAyah(row, locale));
  } catch (error) {
    console.error("[quran-service] Supabase Quran search unavailable:", error);
    return [];
  }
}

export async function getReciters(): Promise<Reciter[]> {
  try {
    const rows = await supabasePublicFetch<DbReciter[]>(
      "/rest/v1/quran_reciters?select=id,code,name_ar,name_en,base_url_template&order=name_en.asc",
    );
    if (rows.length > 0) return rows.map(mapDbReciter);
  } catch (error) {
    console.error("[quran-service] canonical Supabase reciter catalog unavailable:", error);
  }

  return FALLBACK_RECITERS.map((reciter) => ({
    id: reciter.id,
    nameAr: reciter.nameAr,
    nameEn: reciter.nameEn,
    code: reciter.code,
    baseUrlTemplate: reciter.baseUrlTemplate,
    type: reciter.type,
  }));
}

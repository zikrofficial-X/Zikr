import { safeApiFetch } from "@/lib/services/http";
import { getPublicEnv } from "@/lib/env";
import { ServiceError } from "@/lib/types/common";
import type { Ayah, Juz, QuranApiResponse, Surah, Reciter } from "@/lib/types/quran";
import { surahs as fallbackSurahs, reciters as fallbackReciters } from "@/lib/data/content";
import { getCanonicalAyahCount } from "@/lib/utils/surah-mapping";

const QURAN_API_BASE = "https://api.alquran.cloud/v1";
const DEBUG_QURAN = process.env.NODE_ENV !== "production";

function debugLog(message: string, payload?: unknown) {
  if (!DEBUG_QURAN) return;
  if (payload === undefined) {
    console.debug(`[quran-service] ${message}`);
    return;
  }
  console.debug(`[quran-service] ${message}`, payload);
}

const EDITIONS = {
  ar: "quran-uthmani",
  en: "en.asad",
  tafsir: "ar.jalalayn",
} as const;

export type Locale = keyof typeof EDITIONS;

// --- Shared Database Types ---

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

// --- Shared Mappers ---

export function mapDbReciter(reciter: DbReciter): Reciter {
  return {
    id: reciter.code,
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
    numberOfAyahs: surah.ayahs_count && surah.ayahs_count > 0 ? surah.ayahs_count : getCanonicalAyahCount(surah.id),
    revelationType: surah.revelation_place ?? "",
  };
}

export function mapDbAyah(ayah: DbAyah, locale: Locale): Ayah {
  return {
    number: ayah.ayah_number,
    text: locale === "en" ? (ayah.text_en ?? ayah.text_ar) : ayah.text_ar,
    numberInSurah: ayah.ayah_number,
    juz: ayah.juz ?? 0,
    manzil: 0,
    page: ayah.page ?? 0,
    ruku: 0,
    hizbQuarter: ayah.hizb ?? 0,
    sajda: ayah.sajda ?? false,
  };
}

// --- Client-Safe Service (API Fallbacks) ---

export async function getAllSurahs(locale: Locale = "ar"): Promise<Surah[]> {
  debugLog("getAllSurahs request", { locale });

  try {
    const { data: response } = await safeApiFetch<QuranApiResponse<Surah[]>>(
      `${QURAN_API_BASE}/surah`
    );
    if (!response || !Array.isArray(response.data)) {
      throw new Error("Invalid response from Quran API");
    }
    debugLog("getAllSurahs API success", { count: response.data.length });
    return locale === "en"
      ? response.data.map(surah => ({ ...surah, name: surah.englishName }))
      : response.data;
  } catch (error) {
    console.error("[quran-service] Failed to fetch surahs, using fallback:", error);
    return fallbackSurahs.map(s => ({
      number: s.id,
      name: locale === "en" ? s.nameEn : s.nameAr,
      englishName: s.nameEn,
      englishNameTranslation: "",
      numberOfAyahs: s.ayahCount,
      revelationType: s.revelationPlace === "meccan" ? "Meccan" : "Medinan",
    })) as Surah[];
  }
}

export async function getSurahById(
  id: number,
  locale: Locale = "ar"
): Promise<{ surah: Surah; ayahs: Ayah[] } | null> {
  if (!id || id < 1 || id > 114) return null;

  try {
    debugLog("getSurahById trying external API", { id });
    const { data: response } = await safeApiFetch<
      QuranApiResponse<{ ayahs: Ayah[] } & Surah>
    >(`${QURAN_API_BASE}/surah/${id}/${EDITIONS[locale]}`);

    if (!response?.data) return null;
    const { ayahs = [], ...surah } = response.data;
    return { surah, ayahs };
  } catch (error) {
    console.error(`[quran-service] getSurahById error for surah ${id}:`, error);
    return null;
  }
}

export async function getAyah(
  surahId: number,
  ayahId: number,
  locale: Locale = "ar"
): Promise<Ayah | null> {
  if (surahId < 1 || surahId > 114 || ayahId < 1) return null;

  try {
    debugLog("getAyah trying external API", { surahId, ayahId });
    const { data: response } = await safeApiFetch<QuranApiResponse<Ayah>>(
      `${QURAN_API_BASE}/ayah/${surahId}:${ayahId}/${EDITIONS[locale]}`
    );
    return response?.data ?? null;
  } catch (error) {
    console.error(`[quran-service] getAyah error for ${surahId}:${ayahId}:`, error);
    return null;
  }
}

export async function getTafsir(
  surahId: number,
  ayahId: number
): Promise<string | null> {
  if (surahId < 1 || surahId > 114 || ayahId < 1) return null;

  try {
    debugLog("getTafsir trying external API", { surahId, ayahId });
    const { data: response } = await safeApiFetch<QuranApiResponse<Ayah>>(
      `${QURAN_API_BASE}/ayah/${surahId}:${ayahId}/${EDITIONS.tafsir}`
    );
    return response?.data?.text ?? null;
  } catch (error) {
    console.error(`[quran-service] getTafsir error for ${surahId}:${ayahId}:`, error);
    return null;
  }
}

export async function getJuz(
  juzId: number,
  locale: Locale = "ar"
): Promise<Juz | null> {
  if (juzId < 1 || juzId > 30) return null;

  const { data: response } = await safeApiFetch<QuranApiResponse<Juz>>(
    `${QURAN_API_BASE}/juz/${juzId}/${EDITIONS[locale]}`
  );
  return response?.data ?? null;
}

export async function searchQuran(
  query: string,
  locale: Locale = "ar"
): Promise<Ayah[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    const { data: response } = await safeApiFetch<
      QuranApiResponse<{ matches: Ayah[] }>
    >(
      `${QURAN_API_BASE}/search/${encodeURIComponent(cleanQuery)}/all/${EDITIONS[locale]}`
    );
    return response?.data?.matches ?? [];
  } catch (error) {
    if (error instanceof ServiceError) return [];
    throw error;
  }
}

export async function getReciters(): Promise<Reciter[]> {
  try {
    // Try DB via Supabase REST (array response, works client + server)
    const {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey,
    } = getPublicEnv();
    if (supabaseUrl && supabaseKey) {
      const { data: rows } = await safeApiFetch<DbReciter[]>(
        `${supabaseUrl}/rest/v1/quran_reciters?select=id,code,name_ar,name_en,base_url_template&order=name_en.asc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(mapDbReciter);
      }
    }
  } catch {
    // fall through to static fallback
  }
  return fallbackReciters;
}

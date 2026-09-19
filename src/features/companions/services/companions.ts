import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { COMPANIONS } from "@/features/companions/data/fallback";
import { uniqueCompanionSummaries } from "@/features/companions/utils/companions";

export type CompanionSummary = {
  id: string;
  name_ar: string;
  name_en: string | null;
  title_ar: string | null;
  bio_ar: string | null;
  slug: string;
  category: string | null;
};

const STATIC_COMPANION_SLUGS: Record<string, string> = {
  "أبو بكر الصديق": "abu-bakr",
  "عمر بن الخطاب": "umar-ibn-al-khattab",
  "علي بن أبي طالب": "ali-ibn-abi-talib",
  "عثمان بن عفان": "uthman-ibn-affan",
  "خالد بن الوليد": "khalid-ibn-al-walid",
  "بلال بن رباح": "bilal-ibn-rabah",
  "سلمان الفارسي": "salman-al-farisi",
  "عبد الله بن عباس": "abdullah-ibn-abbas",
  "أبو هريرة": "abu-hurayrah",
  "سعد بن أبي وقاص": "saad-ibn-abi-waqqas",
};

const STATIC_COMPANION_CATEGORIES: Record<string, string> = {
  "أبو بكر الصديق": "الخلفاء الراشدون",
  "عمر بن الخطاب": "الخلفاء الراشدون",
  "علي بن أبي طالب": "الخلفاء الراشدون",
  "عثمان بن عفان": "الخلفاء الراشدون",
  "خالد بن الوليد": "القادة",
  "سعد بن أبي وقاص": "القادة",
  "بلال بن رباح": "السابقون إلى الإسلام",
  "سلمان الفارسي": "السابقون إلى الإسلام",
  "عبد الله بن عباس": "السابقون إلى الإسلام",
  "أبو هريرة": "السابقون إلى الإسلام",
};

const FALLBACK_COMPANIONS: CompanionSummary[] = COMPANIONS.map((companion) => ({
  id: `static-${companion.id}`,
  name_ar: companion.name_ar,
  name_en: companion.name_en,
  title_ar: companion.title_ar,
  bio_ar: companion.biography_ar,
  slug: STATIC_COMPANION_SLUGS[companion.name_ar] ?? `static-${companion.id}`,
  category: STATIC_COMPANION_CATEGORIES[companion.name_ar] ?? null,
}));

export async function getPublishedCompanions(): Promise<CompanionSummary[]> {
  try {
    const rows = await supabaseServerAnonRequest<CompanionSummary[]>(
      "/rest/v1/companions?select=id,name_ar,name_en,title_ar,bio_ar,slug,category&published=eq.true&order=name_ar.asc",
      { cache: "force-cache", next: { revalidate: 3600 } },
    );

    const mapped = Array.isArray(rows)
      ? uniqueCompanionSummaries(rows)
      : [];

    return uniqueCompanionSummaries([...mapped, ...FALLBACK_COMPANIONS]);
  } catch (error) {
    console.error("[companions] Failed to load published content:", error);
    return FALLBACK_COMPANIONS;
  }
}

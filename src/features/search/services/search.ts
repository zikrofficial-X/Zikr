import "server-only";

import { searchArticles } from "@/features/articles/services/articles";
import { searchHadith } from "@/features/hadith/services/hadith";
import { searchDuas } from "@/features/dua/services/dua";
import { searchProphets } from "@/features/prophets/services/prophets";
import { searchPublishedCompanions } from "@/features/companions/services/companions";
import { searchStories } from "@/features/stories/services/stories";
import { searchLocalQuran } from "@/features/quran/services/quran-server";
import { searchScholars } from "@/features/scholars/services/scholars";
import { normalizeArabicSearchText } from "@/lib/search/arabic-normalization";

export type PublicSearchResult = {
  id: string;
  type: "surah" | "hadith" | "dua" | "story" | "article" | "prophet" | "companion" | "scholar";
  labelAr: string;
  title: string;
  subtitle: string;
  href: string;
};

const MAX_RESULTS_PER_TYPE = 6;

export async function globalSearch(query: string): Promise<PublicSearchResult[]> {
  const q = normalizeArabicSearchText(query);
  if (q.length < 2) return [];

  const [quran, hadith, duas, prophets, companions, stories, articles, scholars] =
    await Promise.all([
      searchLocalQuran(query, "ar"),
      searchHadith(query),
      searchDuas(query, "ar"),
      searchProphets(query),
      searchPublishedCompanions(query),
      searchStories(query),
      searchArticles(query, "ar"),
      searchScholars(query),
    ]);

  const results: PublicSearchResult[] = [];

  for (const surah of quran.slice(0, MAX_RESULTS_PER_TYPE)) {
    results.push({
      id: `quran-${surah.number}`,
      type: "surah",
      labelAr: "آية",
      title: surah.text.slice(0, 90),
      subtitle: `القرآن الكريم — آية ${surah.numberInSurah}`,
      href: "/quran",
    });
  }

  for (const item of hadith.slice(0, MAX_RESULTS_PER_TYPE)) {
    results.push({
      id: `hadith-${item.id ?? item.number}`,
      type: "hadith",
      labelAr: "حديث",
      title: item.arab?.slice(0, 90) || `حديث ${item.number}`,
      subtitle: `حديث رقم ${item.number}`,
      href: "/hadith",
    });
  }

  const contains = (value: string | undefined) =>
    Boolean(value && normalizeArabicSearchText(value).includes(q));

  for (const item of duas) {
    if (
      contains(item.titleAr) ||
      contains(item.textAr) ||
      contains(item.occasionAr) ||
      contains(item.sourceAr) ||
      contains(item.benefitsAr)
    ) {
      results.push({
        id: item.id,
        type: "dua",
        labelAr: "دعاء",
        title: item.titleAr,
        subtitle: item.occasionAr || item.sourceAr || "دعاء مأثور من مكتبة ذِكر",
        href: `/dua/${item.slug}`,
      });
      if (results.filter((r) => r.type === "dua").length >= MAX_RESULTS_PER_TYPE) break;
    }
  }

  for (const item of prophets) {
    if (contains(item.nameAr) || contains(item.nameEn) || contains(item.bioAr) || contains(item.birthPlaceAr) || contains(item.deathPlaceAr)) {
      results.push({
        id: item.id,
        type: "prophet",
        labelAr: "نبي",
        title: item.nameAr,
        subtitle: item.nameEn || "قصة نبي",
        href: `/prophets/${item.slug}`,
      });
      if (results.filter((r) => r.type === "prophet").length >= MAX_RESULTS_PER_TYPE) break;
    }
  }

  for (const item of companions) {
    if (contains(item.name_ar) || contains(item.name_en ?? undefined) || contains(item.bio_ar ?? undefined)) {
      results.push({
        id: item.id,
        type: "companion",
        labelAr: "صحابي",
        title: item.name_ar,
        subtitle: item.title_ar || "من أعلام الصحابة",
        href: `/companions/${item.slug}`,
      });
      if (results.filter((r) => r.type === "companion").length >= MAX_RESULTS_PER_TYPE) break;
    }
  }

  for (const item of stories) {
    if (contains(item.title) || contains(item.summary ?? undefined) || contains(item.slug) || contains(item.category)) {
      results.push({
        id: item.id,
        type: "story",
        labelAr: "قصة",
        title: item.title,
        subtitle: item.summary || item.category || "قصة من مكتبة ذِكر",
        href: `/stories/${item.slug}`,
      });
      if (results.filter((r) => r.type === "story").length >= MAX_RESULTS_PER_TYPE) break;
    }
  }

  for (const item of articles) {
    if (contains(item.title) || contains(item.summary ?? undefined) || contains(item.content ?? undefined) || (item.tags ?? []).some(contains)) {
      results.push({
        id: item.id,
        type: "article",
        labelAr: "مقال",
        title: item.title,
        subtitle: item.summary || item.author || "مقال تعليمي من مكتبة ذِكر",
        href: `/articles/${item.slug}`,
      });
      if (results.filter((r) => r.type === "article").length >= MAX_RESULTS_PER_TYPE) break;
    }
  }

  for (const item of scholars.slice(0, MAX_RESULTS_PER_TYPE)) {
    results.push({
      id: item.id,
      type: "scholar",
      labelAr: "عالم",
      title: item.nameAr,
      subtitle: item.nameEn,
      href: `/scholars/${item.slug}`,
    });
  }

  return results.slice(0, 40);
}

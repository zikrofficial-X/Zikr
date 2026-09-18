import type { SearchResult } from '@/lib/types/common';
import { searchQuran } from '@/lib/services/quran';
import { searchHadith } from '@/lib/services/hadith';
import { searchScholars } from '@/lib/services/scholars';
import { getStories } from '@/lib/services/stories';

export type GlobalSearchResult =
  | SearchResult<'quran', { text: string; number: number }>
  | SearchResult<'hadith', { number: number; arab?: string; id?: string }>
  | SearchResult<'scholar', { slug: string; nameAr: string; nameEn: string }>
  | SearchResult<'story', { slug: string; category: string }>;

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [quran, hadith, scholars, stories] = await Promise.all([
    searchQuran(q, 'ar'),
    searchHadith(q),
    searchScholars(q),
    getStories(),
  ]);

  const storyMatches = stories.filter((story) =>
    [story.title, story.summary ?? '', story.slug, story.category].some((field) => field?.toLowerCase().includes(q.toLowerCase())),
  );

  return [
    ...quran.map((a) => ({
      type: 'quran' as const,
      id: String(a.number),
      title: `آية ${a.numberInSurah}`,
      description: a.text,
      data: { text: a.text, number: a.number },
    })),
    ...hadith.map((h) => ({
      type: 'hadith' as const,
      id: String(h.number),
      title: `Hadith ${h.number}`,
      description: h.arab || h.id || String(h.number),
      data: { number: h.number, arab: h.arab, id: h.id },
    })),
    ...scholars.map((s) => ({
      type: 'scholar' as const,
      id: s.id,
      title: s.nameEn,
      description: s.nameAr,
      data: { slug: s.slug, nameAr: s.nameAr, nameEn: s.nameEn },
    })),
    ...storyMatches.map((s) => ({
      type: 'story' as const,
      id: s.id,
      title: s.title,
      description: s.summary ?? '',
      data: { slug: s.slug, category: s.category },
    })),
  ];
}

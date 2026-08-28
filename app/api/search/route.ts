import { createClient } from '@/lib/supabase/server';
import { searchQuran } from '@/lib/services/quran';
import { NextRequest, NextResponse } from 'next/server';

interface SearchRow {
  id: string | number;
  title: string | null;
  slug?: string | null;
}

type CachedSearch = { expiresAt: number; results: unknown[] };
const SEARCH_CACHE_TTL_MS = 60_000;
const SEARCH_CACHE_MAX_ENTRIES = 100;
const searchCache = new Map<string, CachedSearch>();

function jsonSearch(results: unknown[]) {
  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim();
    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }
    if (query.length > 100) {
      return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 });
    }

    const cached = searchCache.get(query);
    if (cached && cached.expiresAt > Date.now()) {
      return jsonSearch(cached.results);
    }
    if (cached) searchCache.delete(query);

    try {
      const supabase = await createClient();
      const searchTerm = `%${query}%`;

      const [quranResults, hadithResults, duaResults, storyResults, articleResults] = await Promise.all([
        supabase.from('quran_surahs').select('id, title:name_ar').ilike('name_ar', searchTerm).limit(5),
        supabase.from('hadiths').select('id, title:text_ar').textSearch('searchable', query, { config: 'simple', type: 'plain' }).limit(5),
        supabase.from('duas').select('id, title:title_ar').textSearch('searchable', query, { config: 'simple', type: 'plain' }).limit(5),
        supabase.from('stories').select('id, title').ilike('title', searchTerm).limit(5),
        supabase.from('articles').select('id, title:title_ar, slug').textSearch('searchable', query, { config: 'simple', type: 'plain' }).limit(5),
      ]);

      const results = [
        ...((quranResults.data || []) as SearchRow[]).map((r) => ({ ...r, type: 'quran' })),
        ...((hadithResults.data || []) as SearchRow[]).map((r) => ({ ...r, type: 'hadith' })),
        ...((duaResults.data || []) as SearchRow[]).map((r) => ({ ...r, type: 'dua' })),
        ...((storyResults.data || []) as SearchRow[]).map((r) => ({ ...r, type: 'story' })),
        ...((articleResults.data || []) as SearchRow[]).map((r) => ({ ...r, type: 'article' })),
      ];

      searchCache.set(query, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, results });
      if (searchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
        const oldestKey = searchCache.keys().next().value;
        if (oldestKey) searchCache.delete(oldestKey);
      }
      return jsonSearch(results);
    } catch (error) {
      console.warn('[api/search] Supabase unavailable; using Quran API fallback:', error);
      const quranResults = await searchQuran(query, 'ar');
      const results = quranResults.slice(0, 10).map((result) => ({
        id: `${result.number}-${result.numberInSurah}`,
        title: result.text,
        type: 'quran',
      }));
      return jsonSearch(results);
    }
  } catch (error) {
    console.error('[api/search] GET error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}

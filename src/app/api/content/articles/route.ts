import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type ArticleSummary = {
  id: string;
  title: string | null;
  slug: string | null;
  summary: string | null;
  author: string | null;
  category_id: string | null;
  created_at: string;
};

const ARTICLE_FIELDS = 'id,title,slug,summary,author,category_id,created_at';
const MAX_SEARCH_LENGTH = 120;

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json([]);

  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length > MAX_SEARCH_LENGTH) {
    return NextResponse.json(
      { error: 'Search query is too long.' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const baseQuery = () =>
      supabase
        .from('articles')
        .select(ARTICLE_FIELDS)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(12);

    if (!query) {
      const { data: articles, error } = await baseQuery().limit(60);
      if (error) throw error;
      return NextResponse.json(articles ?? []);
    }

    // Use typed query-builder filters for each searchable field. Building a raw
    // PostgREST `.or(...)` expression from user input can make punctuation act
    // as filter syntax; separate filters let supabase-js encode values safely.
    const pattern = `%${query}%`;
    const results = await Promise.all([
      baseQuery().ilike('title', pattern),
      baseQuery().ilike('summary', pattern),
      baseQuery().ilike('content', pattern),
      baseQuery().contains('tags', [query]),
    ]);

    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const unique = new Map<string, ArticleSummary>();
    for (const result of results) {
      for (const article of (result.data ?? []) as ArticleSummary[]) {
        if (!unique.has(article.id)) unique.set(article.id, article);
      }
    }

    const articles = Array.from(unique.values())
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .slice(0, 12);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('[api/content/articles] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

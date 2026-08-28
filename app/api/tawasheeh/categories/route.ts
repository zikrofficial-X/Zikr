import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Uses cookies via the server Supabase client — can never be statically rendered.
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ data: [] });

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tawasheeh_categories')
      .select('id, name_ar, name_en, slug, description_ar, description_en, icon, order_num')
      .eq('published', true)
      .order('order_num', { ascending: true });

    if (error) {
      console.error('[tawasheeh-categories-api] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: data || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('[tawasheeh-categories-api] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

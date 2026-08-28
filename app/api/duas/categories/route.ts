import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json([]);

  try {
    const supabase = await createClient();
    const { data: categories, error } = await supabase
      .from('dua_categories')
      .select('*')
      .eq('published', true);

    if (error) throw error;
    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('[api/duas/categories] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

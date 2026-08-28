import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json([]);

  try {
    const supabase = await createClient();
    const { data: companions, error } = await supabase
      .from('companions')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(companions || []);
  } catch (error) {
    console.error('[api/content/companions] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch companions' }, { status: 500 });
  }
}

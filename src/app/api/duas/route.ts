import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json([]);

  try {
    const supabase = await createClient();
    const categoryId = request.nextUrl.searchParams.get('category');

    let query = supabase.from('duas').select('*');
    if (categoryId) query = query.eq('category_id', categoryId);

    const { data: duas, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(duas || []);
  } catch (error) {
    console.error('[api/duas] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch duas' }, { status: 500 });
  }
}

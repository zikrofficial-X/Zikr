import { createClient } from '@/lib/supabase/server';
import { requireSupabaseAuth } from '@/lib/supabase/guard';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(favorites || []);
  } catch (error) {
    console.error('[api/user/favorites] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const itemType = body.item_type ?? body.itemType;
    const itemRef = body.item_ref ?? body.itemRef;

    if (!itemType || !itemRef) {
      return NextResponse.json({ error: 'item_type and item_ref are required' }, { status: 400 });
    }

    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, item_type: itemType, item_ref: itemRef })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('[api/user/favorites] POST error:', error);
    return NextResponse.json({ error: 'Failed to create favorite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id param required' }, { status: 400 });

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // scope by user — prevent cross-user deletion

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[api/user/favorites] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 });
  }
}

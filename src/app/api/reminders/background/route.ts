import { createClient } from '@/lib/supabase/server';
import { requireSupabaseAuth } from '@/lib/supabase/guard';
import { NextRequest, NextResponse } from 'next/server';

const allowedIntervals = new Set([15, 30, 60, 120]);

export async function GET() {
  const blocked = requireSupabaseAuth();
  if (blocked) return blocked;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('background_reminder_preferences').select('*').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Failed to load reminder settings' }, { status: 500 });
  return NextResponse.json(data ?? { user_id: user.id, dhikr_enabled: false, dhikr_interval_minutes: 60, salawat_enabled: false, salawat_interval_minutes: 60, quiet_hours_start: null, quiet_hours_end: null });
}

export async function PUT(request: NextRequest) {
  const blocked = requireSupabaseAuth();
  if (blocked) return blocked;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const valid = (key: string) => body[key] === undefined || typeof body[key] === 'boolean';
  for (const key of ['dhikr_enabled', 'salawat_enabled']) if (!valid(key)) return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 });
  for (const key of ['dhikr_interval_minutes', 'salawat_interval_minutes']) if (body[key] !== undefined && !allowedIntervals.has(body[key])) return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('background_reminder_preferences').upsert({ user_id: user.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select('*').single();
  if (error) return NextResponse.json({ error: 'Failed to save reminder settings' }, { status: 500 });
  return NextResponse.json(data);
}

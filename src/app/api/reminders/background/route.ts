import {
  getCurrentReminderPreferences,
  updateCurrentReminderPreferences,
} from '@/features/reminders/services/reminder-preferences';
import { requireSupabaseAuth } from '@/lib/supabase/guard';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const blocked = requireSupabaseAuth();
  if (blocked) return blocked;

  try {
    const data = await getCurrentReminderPreferences();
    if (!data) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/reminders/background] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load reminder settings' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const blocked = requireSupabaseAuth();
  if (blocked) return blocked;

  try {
    const body: unknown = await request.json();
    const result = await updateCurrentReminderPreferences(body);

    if (!result) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[api/reminders/background] PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to save reminder settings' },
      { status: 500 },
    );
  }
}

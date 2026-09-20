import { getCurrentUserNotifications } from '@/features/notifications/services/user-notifications';
import { requireSupabaseAuth } from '@/lib/supabase/guard';
import { NextResponse } from 'next/server';

export async function GET() {
  const unauthenticated = requireSupabaseAuth();
  if (unauthenticated) return unauthenticated;

  try {
    const notifications = await getCurrentUserNotifications();
    if (notifications === null) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('[api/user/notifications] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 },
    );
  }
}

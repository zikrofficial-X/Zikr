import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json().catch(() => ({})) as { action?: unknown; ids?: unknown };
    const action = typeof body.action === 'string' ? body.action : '';
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string' && id.length > 0))] : [];

    if (!['retry', 'delete_failed', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح.' }, { status: 400 });
    }
    if (!ids.length && action !== 'delete_failed') {
      return NextResponse.json({ error: 'حدد عناصر للطابور.' }, { status: 400 });
    }

    if (action === 'retry') {
      const filter = ids.map(encodeURIComponent).join(',');
      await supabaseServerAdminRequest(`/rest/v1/social_publish_queue?id=in.(${filter})&status=eq.failed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'queued', error_message: null, updated_at: new Date().toISOString(), scheduled_at: new Date().toISOString() }),
      });
    }

    if (action === 'delete') {
      const filter = ids.map(encodeURIComponent).join(',');
      await supabaseServerAdminRequest(`/rest/v1/social_publish_queue?id=in.(${filter})&status=eq.failed`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
    }

    if (action === 'delete_failed') {
      await supabaseServerAdminRequest('/rest/v1/social_publish_queue?status=eq.failed', {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/admin/social] POST:', error);
    return NextResponse.json({ error: 'تعذر تنفيذ إجراء طابور النشر.' }, { status: 500 });
  }
}

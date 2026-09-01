import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type QueueItem = {
  id: string;
  content_type: string;
  content_id: string | null;
  title: string;
  target_platforms: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
};

const failedFilter = 'status=eq.failed';

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const items = await supabaseServerAdminRequest<QueueItem[]>(
      '/rest/v1/social_publish_queue?select=id,content_type,content_id,title,target_platforms,status,scheduled_at,published_at,error_message,created_at&order=created_at.desc&limit=250',
    );
    const counts = (items ?? []).reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    return NextResponse.json({ items: items ?? [], counts }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/social] GET:', error);
    return NextResponse.json({ error: 'تعذر تحميل مركز النشر.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = (await request.json().catch(() => ({}))) as { action?: unknown; ids?: unknown };
    const action = typeof body.action === 'string' ? body.action : '';
    const ids = Array.isArray(body.ids)
      ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string' && id.length > 0))]
      : [];

    if (!['retry', 'retry_all_failed', 'delete', 'delete_failed'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح.' }, { status: 400 });
    }

    if ((action === 'retry' || action === 'delete') && ids.length === 0) {
      return NextResponse.json({ error: 'حدد عملية فاشلة أولًا.' }, { status: 400 });
    }

    if (action === 'retry_all_failed') {
      const affected = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?${failedFilter}&select=id,status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({
            status: 'queued',
            error_message: null,
            updated_at: new Date().toISOString(),
            scheduled_at: new Date().toISOString(),
          }),
        },
      );
      return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
    }

    const filter = ids.map(encodeURIComponent).join(',');

    if (action === 'retry') {
      const affected = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?id=in.(${filter})&${failedFilter}&select=id,status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: JSON.stringify({
            status: 'queued',
            error_message: null,
            updated_at: new Date().toISOString(),
            scheduled_at: new Date().toISOString(),
          }),
        },
      );
      return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
    }

    if (action === 'delete') {
      const affected = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?id=in.(${filter})&${failedFilter}&select=id`,
        { method: 'DELETE', headers: { Prefer: 'return=representation' } },
      );
      return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
    }

    const affected = await supabaseServerAdminRequest<QueueItem[]>(
      `/rest/v1/social_publish_queue?${failedFilter}&select=id`,
      { method: 'DELETE', headers: { Prefer: 'return=representation' } },
    );
    return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
  } catch (error) {
    console.error('[api/admin/social] POST:', error);
    return NextResponse.json({ error: 'تعذر تنفيذ إجراء مركز النشر.' }, { status: 500 });
  }
}

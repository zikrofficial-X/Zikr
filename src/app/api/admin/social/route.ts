import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { supabaseServerAdminRequest, createAdminClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/env';

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
  metadata?: Record<string, unknown> | null;
};

const retryableStatuses = new Set(['failed', 'partial']);

function successfulPlatforms(metadata: Record<string, unknown> | null | undefined): Set<string> {
  const values = metadata?.platformResults;
  const result = new Set<string>();

  if (values && typeof values === 'object' && !Array.isArray(values)) {
    for (const [platform, value] of Object.entries(values)) {
      if (!value || typeof value !== 'object') continue;
      const row = value as { platform?: unknown; ok?: unknown; remoteId?: unknown };
      if (
        row.ok === true &&
        (typeof row.remoteId === 'string' && row.remoteId.length > 0) &&
        (row.platform === undefined || row.platform === platform)
      ) {
        result.add(platform);
      }
    }
    return result;
  }

  // Backward compatibility for older queue metadata that used an array.
  if (Array.isArray(values)) {
    for (const value of values) {
      if (!value || typeof value !== 'object') continue;
      const row = value as { platform?: unknown; ok?: unknown; remoteId?: unknown };
      if (
        row.ok === true &&
        typeof row.platform === 'string' &&
        typeof row.remoteId === 'string' &&
        row.remoteId.length > 0
      ) {
        result.add(row.platform);
      }
    }
  }

  return result;
}

function retryPlatforms(item: QueueItem): string[] {
  const succeeded = successfulPlatforms(item.metadata);
  return item.target_platforms.filter(platform => !succeeded.has(platform));
}

async function triggerSocialWorker() {
  const admin = createAdminClient();
  const { data: schedulerSecret, error } = await admin.rpc('get_push_scheduler_secret');
  if (error || typeof schedulerSecret !== 'string' || schedulerSecret.length === 0) {
    throw new Error('تعذر تشغيل عامل النشر تلقائيًا.');
  }

  const siteUrl = getServerEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const response = await fetch(`${siteUrl}/api/internal/video-processing`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${schedulerSecret}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => ({}))) as {
    socialProcessed?: number;
    socialSucceeded?: number;
    socialFailed?: number;
    error?: string;
  };
  if (!response.ok) throw new Error(payload.error || 'تعذر تشغيل عامل النشر.');
  return payload;
}

export async function GET() {
  const auth = await requireAdminApi('social.manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const items = await supabaseServerAdminRequest<QueueItem[]>(
      '/rest/v1/social_publish_queue?select=id,content_type,content_id,title,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata&order=created_at.desc&limit=250',
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
  const auth = await requireAdminApi('social.manage');
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

    const retryItems = async (filter: string) => {
      const items = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?${filter}&select=id,target_platforms,metadata,status`,
      );
      let affected = 0;
      for (const item of items ?? []) {
        if (!retryableStatuses.has(item.status)) continue;
        const platforms = retryPlatforms(item);
        if (platforms.length === 0) {
          await supabaseServerAdminRequest(
            `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
              body: JSON.stringify({
                status: 'published',
                error_message: null,
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }),
            },
          );
          affected += 1;
          continue;
        }
        await supabaseServerAdminRequest(
          `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({
              status: 'queued',
              target_platforms: platforms,
              error_message: null,
              updated_at: new Date().toISOString(),
              scheduled_at: new Date().toISOString(),
            }),
          },
        );
        affected += 1;
      }
      return affected;
    };

    if (action === 'retry_all_failed') {
      const affected = await retryItems('status=in.(failed,partial)');
      const worker = affected > 0 ? await triggerSocialWorker() : null;
      return NextResponse.json({ ok: true, affected, worker });
    }

    const filter = ids.map(encodeURIComponent).join(',');

    if (action === 'retry') {
      const affected = await retryItems(`id=in.(${filter})&status=in.(failed,partial)`);
      const worker = affected > 0 ? await triggerSocialWorker() : null;
      return NextResponse.json({ ok: true, affected, worker });
    }

    if (action === 'delete') {
      const affected = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?id=in.(${filter})&status=in.(failed,partial)&select=id`,
        { method: 'DELETE', headers: { Prefer: 'return=representation' } },
      );
      return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
    }

    const affected = await supabaseServerAdminRequest<QueueItem[]>(
      '/rest/v1/social_publish_queue?status=in.(failed,partial)&select=id',
      { method: 'DELETE', headers: { Prefer: 'return=representation' } },
    );
    return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
  } catch (error) {
    console.error('[api/admin/social] POST:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر تنفيذ إجراء مركز النشر.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { supabaseServerAdminRequest, createAdminClient } from '@/lib/supabase/server';
import { getServerEnv } from '@/lib/env';
import { dispatchGitHubWorkflow } from '@/lib/github/dispatch-workflow';

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
      if (row.ok === true && typeof row.remoteId === 'string' && row.remoteId.length > 0 && (row.platform === undefined || row.platform === platform)) {
        result.add(platform);
      }
    }
    return result;
  }

  if (Array.isArray(values)) {
    for (const value of values) {
      if (!value || typeof value !== 'object') continue;
      const row = value as { platform?: unknown; ok?: unknown; remoteId?: unknown };
      if (row.ok === true && typeof row.platform === 'string' && typeof row.remoteId === 'string' && row.remoteId.length > 0) {
        result.add(row.platform);
      }
    }
  }

  return result;
}

function authBlockedPlatforms(metadata: Record<string, unknown> | null | undefined): Set<string> {
  const values = metadata?.platformResults;
  const result = new Set<string>();
  if (!values || typeof values !== 'object' || Array.isArray(values)) return result;

  for (const [platform, value] of Object.entries(values)) {
    if (!value || typeof value !== 'object') continue;
    const row = value as { ok?: unknown; error?: unknown };
    if (row.ok === false && typeof row.error === 'string') {
      const error = row.error.toLowerCase();
      if (platform.startsWith('facebook') && (error.includes('access token') || error.includes('session has expired') || error.includes('oauth'))) {
        result.add(platform);
      }
    }
  }
  return result;
}

function retryPlatforms(item: QueueItem): string[] {
  const succeeded = successfulPlatforms(item.metadata);
  const blocked = authBlockedPlatforms(item.metadata);
  return item.target_platforms.filter(platform => !succeeded.has(platform) && !blocked.has(platform));
}

async function triggerSocialWorker() {
  return dispatchGitHubWorkflow("publish-social.yml");
}

export async function GET() {
  const auth = await requireAdminApi('social.manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const items = await supabaseServerAdminRequest<QueueItem[]>(
      '/rest/v1/social_publish_queue?select=id,content_type,content_id,title,target_platforms,status,scheduled_at,published_at,error_message,created_at,metadata&order=created_at.desc&limit=250',
    );
    const rows = items ?? [];
    const counts = rows.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    const env = getServerEnv();
    const facebookAuthBlocked = rows.filter(item => retryableStatuses.has(item.status) && authBlockedPlatforms(item.metadata).size > 0).length;
    return NextResponse.json({
      items: rows,
      counts,
      health: {
        youtubeConfigured: Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN),
        facebookEnabled: env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === 'true',
        facebookCredentialsConfigured: Boolean(env.FACEBOOK_PAGE_ID && env.FACEBOOK_PAGE_ACCESS_TOKEN),
        facebookAuthBlocked,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
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
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string' && id.length > 0))] : [];
    if (!['retry', 'retry_all_failed', 'delete', 'delete_failed'].includes(action)) return NextResponse.json({ error: 'إجراء غير صالح.' }, { status: 400 });
    if ((action === 'retry' || action === 'delete') && ids.length === 0) return NextResponse.json({ error: 'حدد عملية فاشلة أولًا.' }, { status: 400 });

    const retryItems = async (filter: string) => {
      const items = await supabaseServerAdminRequest<QueueItem[]>(`/rest/v1/social_publish_queue?${filter}&select=id,target_platforms,metadata,status`);
      let affected = 0;
      for (const item of items ?? []) {
        if (!retryableStatuses.has(item.status)) continue;
        const platforms = retryPlatforms(item);
        if (platforms.length === 0) {
          await supabaseServerAdminRequest(`/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({ status: 'published', error_message: null, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
          });
          affected += 1;
          continue;
        }
        await supabaseServerAdminRequest(`/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({
            status: 'queued',
            target_platforms: platforms,
            error_message: null,
            updated_at: new Date().toISOString(),
            scheduled_at: new Date().toISOString(),
            metadata: { ...(item.metadata ?? {}), authBlocked: false, attempts: 0, nextRetryAt: null },
          }),
        });
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
      const affected = await supabaseServerAdminRequest<QueueItem[]>(`/rest/v1/social_publish_queue?id=in.(${filter})&status=in.(failed,partial)&select=id`, { method: 'DELETE', headers: { Prefer: 'return=representation' } });
      return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
    }

    const affected = await supabaseServerAdminRequest<QueueItem[]>('/rest/v1/social_publish_queue?status=in.(failed,partial)&select=id', { method: 'DELETE', headers: { Prefer: 'return=representation' } });
    return NextResponse.json({ ok: true, affected: affected?.length ?? 0 });
  } catch (error) {
    console.error('[api/admin/social] POST:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'تعذر تنفيذ إجراء مركز النشر.' }, { status: 500 });
  }
}

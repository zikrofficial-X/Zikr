import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';
import { updateVideoRequestStatus } from '@/features/videos/services/video-automation';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi('video.manage');
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid video request ID' }, { status: 400 });
    }
    const currentRows = await supabaseServerAdminRequest<Array<{ status: string }>>(
      `/rest/v1/video_generation_requests?id=eq.${encodeURIComponent(id)}&select=status&limit=1`,
    );
    if (!currentRows?.[0]) {
      return NextResponse.json({ error: 'Video request not found' }, { status: 404 });
    }
    if (currentRows[0].status !== 'failed') {
      return NextResponse.json({ error: 'Only failed video requests can be retried' }, { status: 409 });
    }

    const success = await updateVideoRequestStatus(id, 'pending', undefined, 'failed');
    
    if (!success) {
      return NextResponse.json(
        { error: 'The video request changed before retry could be claimed. Refresh the queue and try again.' },
        { status: 409 }
      );
    }
    await recordAdminAuditEvent({
      action: "video_generation.retry",
      permission: "video.manage",
      resourceType: "video_generation_requests",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api] Failed to retry video request:', error);
    return NextResponse.json(
      { error: 'Failed to retry video request' },
      { status: 500 }
    );
  }
}

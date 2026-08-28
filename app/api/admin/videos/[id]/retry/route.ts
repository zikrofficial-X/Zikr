import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { updateVideoRequestStatus } from '@/lib/services/video-automation';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { id } = await context.params;
    
    const success = await updateVideoRequestStatus(id, 'pending');
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to retry video request' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api] Failed to retry video request:', error);
    return NextResponse.json(
      { error: 'Failed to retry video request' },
      { status: 500 }
    );
  }
}

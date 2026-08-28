import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { getAllVideoRequests } from '@/lib/services/video-automation';

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const requests = await getAllVideoRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('[api] Failed to fetch video requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video requests' },
      { status: 500 }
    );
  }
}

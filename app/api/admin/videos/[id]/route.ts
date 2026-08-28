import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';
import type { VideoGenerationRequest } from '@/lib/types/video';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { id } = await context.params;
    
    const result = await supabaseServerAdminRequest<VideoGenerationRequest>(
      `/rest/v1/video_generation_requests?id=eq.${id}&limit=1`
    );
    
    if (!result || (Array.isArray(result) && result.length === 0)) {
      return NextResponse.json(
        { error: 'Video request not found' },
        { status: 404 }
      );
    }
    
    const videoRequest = Array.isArray(result) ? result[0] : result;
    return NextResponse.json(videoRequest);
  } catch (error) {
    console.error('[api] Failed to fetch video request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { id } = await context.params;
    const body = await request.json();
    
    const { status, youtubeId, facebookId, errorMessage, errorDetails } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    const updateData: Record<string, unknown> = { 
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (youtubeId !== undefined) updateData.youtube_id = youtubeId;
    if (facebookId !== undefined) updateData.facebook_id = facebookId;
    if (errorMessage !== undefined) updateData.error_message = errorMessage;
    if (errorDetails !== undefined) updateData.error_details = errorDetails;
    
    await supabaseServerAdminRequest(
      `/rest/v1/video_generation_requests?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api] Failed to update video request:', error);
    return NextResponse.json(
      { error: 'Failed to update video request' },
      { status: 500 }
    );
  }
}

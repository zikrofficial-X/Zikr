import { NextResponse } from 'next/server';
import { getVideoBySlug } from '@/features/videos/services/videos';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug || !/^[A-Za-z0-9._-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid video slug' }, { status: 400 });
  }

  const video = await getVideoBySlug(slug);
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  return NextResponse.json(video, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400' },
  });
}

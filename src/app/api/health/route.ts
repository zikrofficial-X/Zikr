import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: 'zikr',
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  );
}

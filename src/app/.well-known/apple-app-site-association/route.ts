import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const appId = process.env.IOS_ASSOCIATED_DOMAIN_APP_ID?.trim();
  if (!appId || !/^[A-Z0-9]{10}\.com\.zikr\.app$/.test(appId)) {
    return NextResponse.json(
      { error: "iOS associated-domain App ID is not configured." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const details = [
    {
      appIDs: [appId],
      components: [
        { '/': '/quran/*' },
        { '/': '/hadith/*' },
        { '/': '/articles/*' },
        { '/': '/dua/*' },
        { '/': '/stories/*' },
        { '/': '/auth/callback*', exclude: true },
        { '/': '/*' },
      ],
    },
  ];

  return NextResponse.json({
    applinks: {
      apps: [],
      details,
    },
    webcredentials: {
      apps: [appId],
    },
  });
}

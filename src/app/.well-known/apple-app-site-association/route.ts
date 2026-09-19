import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const appId = process.env.IOS_ASSOCIATED_DOMAIN_APP_ID?.trim();
  const details = appId
    ? [
        {
          appIDs: [appId],
          components: [
            { '/': '/quran/*' },
            { '/': '/hadith/*' },
            { '/': '/articles/*' },
            { '/': '/dua/*' },
            { '/': '/stories/*' },
            { '/': '/auth/callback*' },
            { '/': '/*' },
          ],
        },
      ]
    : [];

  return NextResponse.json({
    applinks: {
      apps: [],
      details,
    },
    webcredentials: {
      apps: appId ? [appId] : [],
    },
  });
}

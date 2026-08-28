import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const fingerprint = process.env.ANDROID_APP_LINKS_SHA256?.trim();

  // Do not publish a fake certificate fingerprint. Until the release signing
  // certificate is configured, an empty valid document is safer than a
  // misleading association that can never verify the app.
  if (!fingerprint) return NextResponse.json([]);

  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.zikr.app',
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ]);
}

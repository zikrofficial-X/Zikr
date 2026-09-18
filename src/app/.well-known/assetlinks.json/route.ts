import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// The fingerprint is public certificate metadata, not a private signing secret.
// Keep an environment override for future key rotation, but ship the current
// production release fingerprint so App Links remain functional when Vercel
// does not have ANDROID_APP_LINKS_SHA256 configured at build time.
const CURRENT_RELEASE_FINGERPRINT =
  '0C:4B:DA:43:75:DB:C5:CE:2C:7F:40:54:AE:0B:70:FD:CA:D0:4B:5E:99:AC:F9:79:4C:B5:27:F2:95:EF:25:E0';

export function GET() {
  const fingerprint =
    process.env.ANDROID_APP_LINKS_SHA256?.trim() || CURRENT_RELEASE_FINGERPRINT;

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

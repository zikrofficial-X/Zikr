'use client';

import dynamic from 'next/dynamic';

const NativeCapacitorBridge = dynamic(
  () =>
    import('./native-capacitor-bridge').then(
      (module) => module.NativeCapacitorBridge,
    ),
  { ssr: false },
);

const NativeGoogleOAuthHandler = dynamic(
  () =>
    import('./native-google-oauth-handler').then(
      (module) => module.NativeGoogleOAuthHandler,
  ),
  { ssr: false },
);

export function NativeCapacitorBridgeLoader() {
  return (
    <>
      <NativeCapacitorBridge />
      {/* NativeGoogleOAuthHandler is the sole owner of the
          com.zikr.app://auth/callback PKCE handoff. */}
      <NativeGoogleOAuthHandler />
    </>
  );
}

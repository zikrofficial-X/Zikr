'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const isAuthLogin = pathname === '/auth/login' || pathname.startsWith('/auth/login/');

  return (
    <>
      {/* The legacy bridge also listens to the OAuth custom scheme. Keep it
          mounted everywhere else, but isolate the login route so the dedicated
          PKCE callback handler is the only listener during Google sign-in. */}
      {!isAuthLogin && <NativeCapacitorBridge />}
      <NativeGoogleOAuthHandler />
    </>
  );
}

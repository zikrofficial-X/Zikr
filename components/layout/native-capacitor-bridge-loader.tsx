'use client';

import dynamic from 'next/dynamic';

const NativeCapacitorBridge = dynamic(
  () =>
    import('./native-capacitor-bridge').then(
      (module) => module.NativeCapacitorBridge,
    ),
  { ssr: false },
);

export function NativeCapacitorBridgeLoader() {
  return <NativeCapacitorBridge />;
}

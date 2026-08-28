import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'محدد القبلة | ZIKR',
  description: 'احصل على اتجاه القبلة بدقة من موقعك الجغرافي - أداة إسلامية مفيدة لتحديد اتجاه مكة المكرمة',
  path: '/qibla',
});

export default function QiblaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

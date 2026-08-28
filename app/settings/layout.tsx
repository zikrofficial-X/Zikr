import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'الإعدادات',
  description: 'إعدادات تجربة ذِكر الشخصية للتنبيهات والتذكيرات المحلية.',
  path: '/settings',
  noindex: true,
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

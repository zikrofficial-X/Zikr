import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'تواصل معنا',
  description: 'تواصل مع فريق منصة ذِكرٌ — نردّ على استفساراتك واقتراحاتك خلال 24 ساعة.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

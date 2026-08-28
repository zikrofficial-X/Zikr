import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'عداد التسبيح | ZIKR',
  description: 'عداد تسبيح ذكي - احسب أذكارك وتسبيحاتك بسهولة مع تتبع التقدم والحفظ التلقائي',
  path: '/tasbeeh',
});

export default function TasbeehLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

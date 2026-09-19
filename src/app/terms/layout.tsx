import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'الشروط والأحكام',
  description: 'شروط وأحكام استخدام منصة ZIKR والمسؤوليات والحقوق الخاصة بالمستخدمين.',
  path: '/terms',
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

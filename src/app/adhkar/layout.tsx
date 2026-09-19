import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'الأذكار',
  description: 'أذكار الصباح والمساء وأذكار النوم والاستيقاظ وسائر الأذكار اليومية من الكتاب والسنة.',
  path: '/adhkar',
});

export default function AdhkarLayout({ children }: { children: React.ReactNode }) {
  return children;
}

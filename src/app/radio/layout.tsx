import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'الإذاعة القرآنية',
  description: 'استمع مباشرة إلى إذاعات القرآن الكريم من مختلف الدول بتلاوات كبار القراء على مدار الساعة.',
  path: '/radio',
});

export default function RadioLayout({ children }: { children: React.ReactNode }) {
  return children;
}

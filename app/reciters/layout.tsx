import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'القراء',
  description: 'تعرف على كبار قراء القرآن الكريم واستمع إلى تلاواتهم: عبد الباسط، المنشاوي، الحصري وغيرهم.',
  path: '/reciters',
});

export default function RecitersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

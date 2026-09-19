import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'ألغاز الأطفال',
  description: 'ألعاب وألغاز تعليمية إسلامية ممتعة للأطفال في منصة ZIKR.',
  path: '/kids/puzzle',
});

export default function KidsPuzzleLayout({ children }: { children: React.ReactNode }) {
  return children;
}

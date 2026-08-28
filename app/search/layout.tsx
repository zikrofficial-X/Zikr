import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'البحث',
  description: 'ابحث في القرآن الكريم والأحاديث النبوية والأدعية والقصص والمحتوى الإسلامي في منصة ZIKR.',
  path: '/search',
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}

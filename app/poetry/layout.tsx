import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'الشعر الإسلامي',
  description: 'مختارات من الشعر والقصائد الإسلامية في الزهد والحكمة ومدح النبي صلى الله عليه وسلم.',
  path: '/poetry',
});

export default function PoetryLayout({ children }: { children: React.ReactNode }) {
  return children;
}

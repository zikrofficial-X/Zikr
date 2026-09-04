import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'القراء الكرام',
  description: 'دليل تفاعلي للاستماع إلى تلاوات القراء.',
  path: '/reciters',
  noindex: true,
});

export default function RecitersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

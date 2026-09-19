import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'التفسير',
  description: 'تفسير القرآن الكريم آية بآية من كتب التفسير المعتمدة لفهم معاني كتاب الله.',
  path: '/tafsir',
});

export default function TafsirLayout({ children }: { children: React.ReactNode }) {
  return children;
}

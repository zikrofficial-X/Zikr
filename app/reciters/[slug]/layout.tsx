import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { reciters } from '@/lib/data/content';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const reciter = reciters.find((r) => r.id === slug || r.code === slug);
  return pageMetadata({
    title: reciter ? `القارئ ${reciter.nameAr}` : 'قارئ القرآن',
    description: reciter
      ? `استمع إلى تلاوات القارئ ${reciter.nameAr} لسور القرآن الكريم كاملة بجودة عالية.`
      : 'سيرة القارئ وتلاواته الصوتية للقرآن الكريم.',
    path: `/reciters/${slug}`,
  });
}

export default function ReciterSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

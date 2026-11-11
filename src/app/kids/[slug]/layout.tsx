import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/site';
import { getKidsContentBySlug } from '@/features/kids/services/kids-content';

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getKidsContentBySlug(slug, "ar").catch(() => null);
  if (!item) {
    return {
      ...pageMetadata({
        title: 'محتوى الأطفال',
        description: 'قصص وأنشطة إسلامية تعليمية ممتعة للأطفال.',
        path: `/kids/${slug}`,
      }),
      robots: { index: false, follow: false },
    };
  }

  const description = item.content_ar
    ? item.content_ar.replace(/\s+/g, " ").slice(0, 160)
    : 'قصص وأنشطة إسلامية تعليمية ممتعة للأطفال.';
  return pageMetadata({
    title: item.title_ar || item.title_en,
    description,
    path: `/kids/${slug}`,
  });
}

export default async function KidsSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getKidsContentBySlug(slug, "ar").catch(() => null);
  if (!item) notFound();
  return <>{children}</>;
}

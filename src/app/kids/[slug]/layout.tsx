import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { getKidsContentBySlug } from '@/features/kids/services/kids-content';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = 'محتوى الأطفال';
  let description = 'قصص وأنشطة إسلامية تعليمية ممتعة للأطفال.';

  // Use the same visibility-aware resolver as the page API. A database
  // slug that is unpublished, inactive, or age-unapproved must not inherit
  // metadata from a same-slug static fallback.
  try {
    const item = await getKidsContentBySlug(slug, "ar");
    if (item) {
      title = item.title_ar;
      if (item.content_ar) description = item.content_ar.replace(/\s+/g, " ").slice(0, 160);
    }
  } catch {
    // Keep generic metadata when visibility cannot be verified.
  }
  return pageMetadata({ title, description, path: `/kids/${slug}` });
}

export default function KidsSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

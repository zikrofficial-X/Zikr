import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { supabaseServerAnonRequest } from '@/lib/supabase/server';
import { getKidsItemBySlug } from '@/lib/data/kids-content';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = 'محتوى الأطفال';
  let description = 'قصص وأنشطة إسلامية تعليمية ممتعة للأطفال.';

  // Static curated content first, then database fallback.
  const staticItem = getKidsItemBySlug(slug);
  if (staticItem) {
    title = staticItem.title_ar;
    if (staticItem.content_ar) description = staticItem.content_ar.replace(/\s+/g, ' ').slice(0, 160);
  } else {
    try {
      const data = await supabaseServerAnonRequest<{ title_ar: string; description_ar?: string }[]>(
        `/rest/v1/kids_content?select=title_ar,description_ar&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`
      );
      if (data?.[0]) {
        title = data[0].title_ar;
        if (data[0].description_ar) description = data[0].description_ar.slice(0, 160);
      }
    } catch {
      // fall back to generic metadata
    }
  }
  return pageMetadata({ title, description, path: `/kids/${slug}` });
}

export default function KidsSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

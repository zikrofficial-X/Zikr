import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { supabaseServerAnonRequest } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = 'فيديو';
  let description = 'شاهد الفيديو في مكتبة المحتوى المرئي الإسلامي بمنصة ZIKR.';
  try {
    const data = await supabaseServerAnonRequest<{ title: string; description?: string }[]>(
      `/rest/v1/videos?select=title,description&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`
    );
    if (data?.[0]) {
      title = data[0].title;
      if (data[0].description) description = data[0].description.slice(0, 160);
    }
  } catch {
    // fall back to generic metadata
  }
  return pageMetadata({ title, description, path: `/videos/${slug}` });
}

export default function VideoSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

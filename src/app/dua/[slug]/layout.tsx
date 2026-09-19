import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { supabaseServerAnonRequest } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = 'دعاء';
  let description = 'دعاء مأثور من الكتاب والسنة مع النص الكامل وفضل الدعاء.';
  try {
    const data = await supabaseServerAnonRequest<{ title_ar: string; occasion_ar?: string }[]>(
      `/rest/v1/duas?select=title_ar,occasion_ar&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`
    );
    if (data?.[0]) {
      title = data[0].title_ar;
      if (data[0].occasion_ar) description = `دعاء ${data[0].title_ar} - ${data[0].occasion_ar}`.slice(0, 160);
    }
  } catch {
    // fall back to generic metadata
  }
  return pageMetadata({ title, description, path: `/dua/${slug}` });
}

export default function DuaSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

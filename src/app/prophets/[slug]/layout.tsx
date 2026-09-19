import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import { supabaseServerAnonRequest } from '@/lib/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let title = 'قصة نبي';
  let description = 'قصة من قصص الأنبياء عليهم السلام كما وردت في القرآن الكريم والسنة النبوية.';
  try {
    const data = await supabaseServerAnonRequest<{ name_ar: string; bio_ar?: string }[]>(
      `/rest/v1/prophets?select=name_ar,bio_ar&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`
    );
    if (data?.[0]) {
      title = `قصة ${data[0].name_ar}`;
      if (data[0].bio_ar) description = data[0].bio_ar.slice(0, 160);
    }
  } catch {
    // fall back to generic metadata
  }
  return pageMetadata({ title, description, path: `/prophets/${slug}` });
}

export default function ProphetSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

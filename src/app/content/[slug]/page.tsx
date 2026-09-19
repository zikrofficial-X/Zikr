import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Source = {
  name: string;
  reference: string | null;
  author: string | null;
  publisher: string | null;
  license: string | null;
  attribution: string | null;
};

type ContentItem = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  body_ar: string;
  body_en: string | null;
  content_type: string;
  category: string;
  tags: string[] | null;
  author: string | null;
  published_at: string | null;
  source_id: string | null;
  content_sources: Source | Source[] | null;
};

export default async function ContentDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await createClient();
  const { data: rawItem, error } = await db
    .from('content_library')
    .select('id,slug,title_ar,title_en,summary_ar,summary_en,body_ar,body_en,content_type,category,tags,author,published_at,source_id,content_sources(name,reference,author,publisher,license,attribution)')
    .eq('slug', slug)
    .eq('published', true)
    .eq('review_status', 'approved')
    .maybeSingle();

  if (error || !rawItem) notFound();
  const item = rawItem as unknown as ContentItem;
  const source = Array.isArray(item.content_sources) ? item.content_sources[0] : item.content_sources;

  return (
    <main className="min-h-screen bg-brand-emeraldDeep text-brand-cream" dir="rtl">
      <article className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <Link href="/library" className="text-sm text-brand-gold/70 hover:text-brand-gold">← العودة إلى المكتبة</Link>
        <div className="mt-6 text-xs text-brand-gold/60">{item.category} · {item.content_type}</div>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-brand-gold">{item.title_ar}</h1>
        {item.title_en && <p className="mt-2 text-lg text-brand-cream/45">{item.title_en}</p>}
        {(item.author || item.published_at) && <div className="mt-5 text-sm text-brand-cream/45">{item.author ? `المؤلف: ${item.author}` : ''}{item.published_at ? ` · نُشر ${new Date(item.published_at).toLocaleDateString('ar-EG')}` : ''}</div>}
        {item.summary_ar && <div className="mt-8 rounded-2xl border border-brand-gold/15 bg-black/20 p-5 leading-8 text-brand-cream/70">{item.summary_ar}</div>}
        <div className="prose prose-invert mt-10 max-w-none whitespace-pre-wrap text-lg leading-10 text-brand-cream/80">{item.body_ar}</div>
        {item.body_en && <details className="mt-10 rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><summary className="cursor-pointer text-brand-gold">English</summary><div className="mt-5 whitespace-pre-wrap leading-8 text-brand-cream/65" dir="ltr">{item.body_en}</div></details>}
        <div className="mt-10 flex flex-wrap gap-2">{(item.tags ?? []).map((tag: string) => <span key={tag} className="rounded-full border border-brand-gold/10 px-3 py-1 text-xs text-brand-cream/45">#{tag}</span>)}</div>
        {source && <section className="mt-10 rounded-2xl border border-brand-gold/15 bg-black/20 p-5"><h2 className="font-bold text-brand-gold">المصدر والتوثيق</h2><p className="mt-2 text-sm leading-7 text-brand-cream/55">{source.name}{source.reference ? ` · ${source.reference}` : ''}{source.author ? ` · ${source.author}` : ''}</p>{source.publisher && <p className="text-xs text-brand-cream/40">الناشر: {source.publisher}</p>}{source.license && <p className="text-xs text-brand-cream/40">الترخيص: {source.license}</p>}{source.attribution && <p className="text-xs text-brand-cream/40">النسبة: {source.attribution}</p>}</section>}
      </article>
    </main>
  );
}

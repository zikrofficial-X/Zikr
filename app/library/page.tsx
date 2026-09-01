import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type LibraryItem = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  content_type: string;
  category: string;
  tags: string[] | null;
  author: string | null;
  published_at: string | null;
};

export default async function LibraryPage() {
  const db = createAdminClient();
  const { data: rawItems, error } = await db
    .from('content_library')
    .select('id,slug,title_ar,title_en,summary_ar,summary_en,content_type,category,tags,author,published_at')
    .eq('published', true)
    .eq('review_status', 'approved')
    .order('published_at', { ascending: false })
    .limit(60);

  if (error) {
    return <main className="min-h-screen bg-brand-emeraldDeep p-8 text-brand-cream" dir="rtl">تعذر تحميل المكتبة حاليًا.</main>;
  }

  const items = (rawItems ?? []) as LibraryItem[];

  return (
    <main className="min-h-screen bg-brand-emeraldDeep text-brand-cream" dir="rtl">
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <p className="text-xs tracking-[0.2em] text-brand-cream/35 uppercase">ZIKR KNOWLEDGE LIBRARY</p>
        <h1 className="mt-2 text-4xl font-bold text-brand-gold">المكتبة الإسلامية</h1>
        <p className="mt-3 max-w-3xl leading-8 text-brand-cream/60">مكتبة قابلة للتوسع للقراءة والتعلم والبحث، ولا يظهر فيها إلا المحتوى الذي اجتاز حالة الاعتماد والنشر.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/content/${item.slug}`} className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-brand-gold/40">
              <div className="text-xs text-brand-gold/60">{item.category} · {item.content_type}</div>
              <h2 className="mt-2 text-xl font-bold text-brand-gold">{item.title_ar}</h2>
              {item.title_en && <p className="mt-1 text-sm text-brand-cream/45">{item.title_en}</p>}
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-brand-cream/60">{item.summary_ar ?? item.summary_en}</p>
              <div className="mt-4 flex flex-wrap gap-1">{(item.tags ?? []).slice(0, 5).map((tag: string) => <span key={tag} className="rounded-full border border-brand-gold/10 px-2 py-1 text-[11px] text-brand-cream/40">#{tag}</span>)}</div>
            </Link>
          ))}
        </div>

        {items.length === 0 && <div className="mt-10 rounded-2xl border border-brand-gold/10 bg-black/20 p-8 text-center text-brand-cream/50">المكتبة قيد الإثراء. المواد الجديدة ستظهر بعد اعتمادها.</div>}
      </section>
    </main>
  );
}

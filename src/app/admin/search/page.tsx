export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { searchAdminContent } from "@/features/admin/services/platform";

export const metadata: Metadata = { title: "بحث الإدارة | الأدمن" };

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPermission("content.manage");
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const searchResult = query
    ? await searchAdminContent(query)
    : { items: [], unavailableSources: [] as string[] };
  const results = searchResult.items;

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">GLOBAL SEARCH</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">البحث المركزي</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">بحث موحد داخل المقالات والقصص والفيديوهات ومكتبة المحتوى.</p>
      </header>

      <form className="flex gap-2" method="get">
        <input name="q" defaultValue={query} placeholder="ابحث بالعنوان أو المحتوى…" className="min-w-0 flex-1 rounded-xl border border-brand-gold/15 bg-black/20 px-4 py-3 text-sm text-brand-cream outline-none focus:border-brand-gold/40" />
        <button className="rounded-xl border border-brand-gold/25 px-5 py-3 text-sm font-semibold text-brand-gold hover:bg-brand-gold/10" type="submit">بحث</button>
      </form>

      {query && <p className="text-sm text-brand-cream/40">نتائج البحث عن: <span className="text-brand-cream/70">{query}</span> — {searchResult.unavailableSources.length ? "نتائج جزئية" : results.length + " نتيجة"}</p>}
      {query && searchResult.unavailableSources.length > 0 ? (
        <div role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-6 text-amber-100">
          تعذر البحث في بعض المصادر: {searchResult.unavailableSources.join("، ")}. النتائج المعروضة جزئية ولا تعني أن هذه المصادر لا تحتوي على تطابقات.
        </div>
      ) : null}

      <section className="space-y-3">
        {results.map((item) => {
          const href =
            item.type === "مقال" && item.slug
              ? `/articles/${item.slug}`
              : item.type === "قصة" && item.slug
                ? `/stories/${item.slug}`
                : item.type === "فيديو" && item.slug
                  ? `/videos/${item.slug}`
                  : item.type === "حديث" || item.type === "دعاء"
                    ? "/admin/knowledge"
                    : "/admin/content";
          return (
            <div key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-gold/10 bg-black/15 p-4">
              <div><div className="text-xs text-brand-gold/60">{item.type}</div><h2 className="mt-1 font-semibold text-brand-cream">{item.title}</h2><p className="mt-1 text-xs text-brand-cream/35">{item.published ? "منشور" : "مسودة"} · {item.updated_at ? new Date(item.updated_at).toLocaleString('ar-EG-u-nu-latn') : '—'}</p></div>
              <Link href={href} className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold hover:bg-brand-gold/10">فتح</Link>
            </div>
          );
        })}
        {query && results.length === 0 && searchResult.unavailableSources.length === 0 && <div className="rounded-2xl border border-brand-gold/10 bg-black/10 p-8 text-center text-sm text-brand-cream/40">لم يتم العثور على نتائج في المصادر التي تم فحصها بنجاح.</div>}{query && results.length === 0 && searchResult.unavailableSources.length > 0 ? <div role="status" className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-8 text-center text-sm text-amber-100">لا توجد نتائج من المصادر المتاحة، وبعض المصادر لم تنجح قراءتها.</div> : null}
      </section>
    </Container>
  );
}

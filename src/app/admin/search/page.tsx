export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { searchAdminContent } from "@/features/admin/services/platform";

export const metadata: Metadata = { title: "بحث الإدارة | الأدمن" };

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminPermission("dashboard.view");
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const results = query ? await searchAdminContent(query) : [];

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

      {query && <p className="text-sm text-brand-cream/40">نتائج البحث عن: <span className="text-brand-cream/70">{query}</span> — {results.length} نتيجة</p>}

      <section className="space-y-3">
        {results.map((item) => {
          const href = item.type === "مقال" && item.slug ? `/articles/${item.slug}` : item.type === "قصة" && item.slug ? `/stories/${item.slug}` : item.type === "فيديو" && item.slug ? `/videos/${item.slug}` : "/admin/content";
          return (
            <div key={`${item.type}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-gold/10 bg-black/15 p-4">
              <div><div className="text-xs text-brand-gold/60">{item.type}</div><h2 className="mt-1 font-semibold text-brand-cream">{item.title}</h2><p className="mt-1 text-xs text-brand-cream/35">{item.published ? "منشور" : "مسودة"} · {item.updated_at ? new Date(item.updated_at).toLocaleString('ar-EG') : '—'}</p></div>
              <Link href={href} className="rounded-lg border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold hover:bg-brand-gold/10">فتح</Link>
            </div>
          );
        })}
        {query && results.length === 0 && <div className="rounded-2xl border border-brand-gold/10 bg-black/10 p-8 text-center text-sm text-brand-cream/40">لا توجد نتائج.</div>}
      </section>
    </Container>
  );
}

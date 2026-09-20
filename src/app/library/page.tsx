import Link from "next/link";

import { getPublicContentLibrary } from "@/features/content-library/services/content-library";
import { pageMetadata } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "المكتبة الإسلامية",
  description:
    "مكتبة ذِكر القابلة للتوسع للقراءة والتعلم والبحث، مع عرض المحتوى المنشور بعد اعتماده.",
  path: "/library",
});

export const revalidate = 1800;

export default async function LibraryPage() {
  const items = await getPublicContentLibrary(60);

  return (
    <main className="min-h-screen bg-brand-emeraldDeep text-brand-cream" dir="rtl">
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-cream/35">
          ZIKR KNOWLEDGE LIBRARY
        </p>
        <h1 className="mt-2 text-4xl font-bold text-brand-gold">
          المكتبة الإسلامية
        </h1>
        <p className="mt-3 max-w-3xl leading-8 text-brand-cream/60">
          مكتبة قابلة للتوسع للقراءة والتعلم والبحث. لا يظهر فيها إلا المحتوى
          الذي اجتاز حالة الاعتماد والنشر.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={"/content/" + item.slug}
              className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-brand-gold/40"
            >
              <div className="text-xs text-brand-gold/60">
                {item.category} · {item.content_type}
              </div>
              <h2 className="mt-2 text-xl font-bold text-brand-gold">
                {item.title_ar}
              </h2>
              {item.title_en && (
                <p className="mt-1 text-sm text-brand-cream/45" dir="ltr">
                  {item.title_en}
                </p>
              )}
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-brand-cream/60">
                {item.summary_ar ?? item.summary_en}
              </p>
              {item.tags && item.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {item.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-brand-gold/10 px-2 py-1 text-[11px] text-brand-cream/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>

        {items.length === 0 && (
          <div className="mt-10 rounded-2xl border border-brand-gold/10 bg-black/20 p-8 text-center text-brand-cream/50">
            المكتبة قيد الإثراء. المواد الجديدة ستظهر بعد اعتمادها.
          </div>
        )}
      </section>
    </main>
  );
}

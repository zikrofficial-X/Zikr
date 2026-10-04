import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getPrimaryContentSource,
  getPublicContentBySlug,
} from "@/features/content-library/services/content-library";
import { pageMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const item = await getPublicContentBySlug(slug, locale);

  return pageMetadata({
    title: item?.title || (isEnglish ? "Content" : "محتوى"),
    description:
      item?.summary?.slice(0, 160) ??
      (isEnglish
        ? "Published material from the ZIKR Islamic library."
        : "مادة منشورة ضمن مكتبة ذِكر الإسلامية."),
    path: `/content/${slug}`,
    noindex: !item,
  });
}

export default async function ContentDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const item = await getPublicContentBySlug(slug, locale);

  if (!item || (isEnglish && !item.title)) notFound();

  const source = getPrimaryContentSource(item.content_sources);
  const publishedDate = item.published_at
    ? new Date(item.published_at).toLocaleDateString(
        isEnglish ? "en-US" : "ar-EG",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : null;

  return (
    <main
      className="min-h-screen bg-brand-emeraldDeep text-brand-cream"
      dir={isEnglish ? "ltr" : "rtl"}
    >
      <article className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <Link
          href="/library"
          className="text-sm text-brand-gold/70 hover:text-brand-gold"
        >
          {isEnglish ? "← Back to library" : "← العودة إلى المكتبة"}
        </Link>

        <div className="mt-6 text-xs text-brand-gold/60">
          {item.category} · {item.content_type}
        </div>

        <h1 className="mt-2 text-4xl font-bold leading-tight text-brand-gold">
          {item.title}
        </h1>

        {(item.author || publishedDate) && (
          <div className="mt-5 text-sm text-brand-cream/45">
            {item.author
              ? isEnglish
                ? `Author: ${item.author}`
                : `المؤلف: ${item.author}`
              : ""}
            {item.author && publishedDate ? " · " : ""}
            {publishedDate
              ? isEnglish
                ? `Published ${publishedDate}`
                : `نُشر ${publishedDate}`
              : ""}
          </div>
        )}

        {item.summary && (
          <div className="mt-8 rounded-2xl border border-brand-gold/15 bg-black/20 p-5 leading-8 text-brand-cream/70">
            {item.summary}
          </div>
        )}

        {item.body ? (
          <div className="prose prose-invert mt-10 max-w-none whitespace-pre-wrap text-lg leading-10 text-brand-cream/80">
            {item.body}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-brand-gold/10 bg-black/15 p-6 text-brand-cream/55">
            {isEnglish
              ? "A full published text is not currently available in this language."
              : "لا يتوفر نص كامل منشور لهذه المادة حاليًا."}
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-brand-gold/10 px-3 py-1 text-xs text-brand-cream/45"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {source && (
          <section className="mt-10 rounded-2xl border border-brand-gold/15 bg-black/20 p-5">
            <h2 className="font-bold text-brand-gold">
              {isEnglish ? "Source & verification" : "المصدر والتوثيق"}
            </h2>
            <p className="mt-2 text-sm leading-7 text-brand-cream/55">
              {isEnglish ? source.nameEn : source.nameAr}
              {source.reference ? ` · ${source.reference}` : ""}
              {source.author ? ` · ${source.author}` : ""}
            </p>
            {source.publisher && (
              <p className="text-xs text-brand-cream/40">
                {isEnglish ? "Publisher: " : "الناشر: "}{source.publisher}
              </p>
            )}
            {source.license && (
              <p className="text-xs text-brand-cream/40">
                {isEnglish ? "License: " : "الترخيص: "}{source.license}
              </p>
            )}
            {source.attribution && (
              <p className="text-xs text-brand-cream/40">
                {isEnglish ? "Attribution: " : "النسبة: "}{source.attribution}
              </p>
            )}
          </section>
        )}
      </article>
    </main>
  );
}

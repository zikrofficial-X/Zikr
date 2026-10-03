import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { getArticleBySlug } from "@/features/articles/services/articles";
import { getRequestLocale } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const article = await getArticleBySlug(slug, locale);

  return pageMetadata({
    title: article?.title ?? (isEnglish ? "Article" : "مقال"),
    description: article?.summary?.slice(0, 160) ?? (isEnglish ? "Read the complete article on ZIKR." : "اقرأ المقال كاملاً في منصة ZIKR للمحتوى الإسلامي."),
    path: `/articles/${slug}`,
    noindex: !article,
  });
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}

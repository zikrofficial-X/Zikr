import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { getArticleBySlug } from "@/features/articles/services/articles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  return pageMetadata({
    title: article?.title ?? "مقال",
    description: article?.summary?.slice(0, 160) ?? "اقرأ المقال كاملاً في منصة ZIKR للمحتوى الإسلامي.",
    path: `/articles/${slug}`,
    noindex: !article,
  });
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}

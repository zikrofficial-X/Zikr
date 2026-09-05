import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { getArticleBySlug, type Article } from "@/lib/services/content";
import { getStaticArticleBySlug } from "@/lib/data/articles";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

// A public editorial page must contain enough original material to stand on
// its own. Short placeholders remain unavailable until an editor completes them.
const MIN_PUBLIC_ARTICLE_CHARS = 1800;

interface ArticleReference {
  url: string;
  title: string;
  sourceType?: string;
}

function getArticleReferences(metadata: Article["metadata"]): ArticleReference[] {
  const references = metadata?.references;
  if (!Array.isArray(references)) return [];

  return references.flatMap(reference => {
    if (!reference || typeof reference !== "object") return [];
    const item = reference as Record<string, unknown>;
    if (typeof item.url !== "string") return [];

    try {
      const parsed = new URL(item.url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
      return [
        {
          url: parsed.toString(),
          title:
            typeof item.title_ar === "string" && item.title_ar.trim()
              ? item.title_ar
              : "فتح المصدر للتحقق",
          sourceType:
            typeof item.source_type === "string" ? item.source_type : undefined,
        },
      ];
    } catch {
      return [];
    }
  });
}

function getMetadataReferences(metadata: Article["metadata"]): ArticleReference[] {
  const sourceUrls = metadata?.source_urls;
  if (!Array.isArray(sourceUrls)) return [];

  return sourceUrls.flatMap(url => {
    if (typeof url !== "string") return [];
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
      return [{ url: parsed.toString(), title: "مصدر للتحقق" }];
    } catch {
      return [];
    }
  });
}

function dedupeReferences(references: ArticleReference[]) {
  return Array.from(new Map(references.map(item => [item.url, item])).values());
}

function staticArticleToArticle(slug: string): Article | null {
  const article = getStaticArticleBySlug(slug);
  if (!article) return null;

  return {
    id: article.id,
    title: article.title_ar || article.title,
    slug: article.slug,
    summary: article.summary_ar || article.summary,
    content: article.content_ar || article.content,
    author: article.author,
    featuredImageUrl: article.featured_image_url || undefined,
    views: article.views,
    published: true,
    tags: article.tags,
    createdAt: article.created_at,
  };
}

async function loadArticle(slug: string): Promise<Article | null> {
  return (await getArticleBySlug(slug)) ?? staticArticleToArticle(slug);
}

function hasSubstantialContent(
  article: Article | null,
): article is Article & { content: string } {
  return Boolean(
    article?.content?.trim() &&
      article.content.trim().length >= MIN_PUBLIC_ARTICLE_CHARS,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!article) {
    return pageMetadata({
      title: "المقال غير موجود",
      description: "لم يتم العثور على المقال المطلوب في منصة ذِكرٌ.",
      path: `/articles/${slug}`,
      noindex: true,
    });
  }

  const qualityApproved = hasSubstantialContent(article);

  return pageMetadata({
    title: article.title,
    description: article.summary || `اقرأ مقال ${article.title} في منصة ذِكرٌ.`,
    path: `/articles/${article.slug}`,
    noindex: !qualityApproved,
  });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!hasSubstantialContent(article)) {
    // Do not expose incomplete editorial rows as public landing pages.
    notFound();
  }

  const references = dedupeReferences([
    ...getArticleReferences(article.metadata),
    ...getMetadataReferences(article.metadata),
  ]);
  const content = article.content.trim();
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <Container className="py-12 space-y-8 max-w-3xl" dir="rtl">
      {article.featuredImageUrl && (
        <div className="w-full h-96 rounded-lg overflow-hidden">
          <Image
            src={article.featuredImageUrl}
            width={800}
            height={384}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">{article.title}</h1>

        {article.summary && (
          <p className="text-brand-cream/70 text-lg leading-8">
            {article.summary}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-6 text-sm text-brand-cream/60">
          {article.author && <span>الكاتب: {article.author}</span>}
          <time dateTime={article.createdAt}>
            {new Date(article.createdAt).toLocaleDateString("ar-SA")}
          </time>
          <span aria-label="مدة القراءة التقريبية">قراءة: {readingMinutes} دقيقة</span>
          <span>{wordCount.toLocaleString("ar-EG")} كلمة تقريبًا</span>
        </div>
      </header>

      <Card className="p-8 space-y-6 bg-black/30 border-brand-gold/30">
        <article className="prose prose-invert max-w-none text-brand-cream leading-9 whitespace-pre-wrap">
          {content}
        </article>
      </Card>

      <aside className="rounded-3xl border border-brand-gold/20 bg-brand-gold/5 p-5 text-sm leading-7 text-brand-cream/75">
        هذه صفحة تحريرية تعليمية من فريق ذِكر. عند نقل نص شرعي أو معلومة تاريخية، نضع مصدر التحقق قدر الإمكان، ولا تُعد المقالات العامة فتوى شخصية أو بديلًا عن سؤال أهل العلم.
      </aside>

      {references.length > 0 && (
        <section
          aria-labelledby="article-references"
          className="rounded-3xl border border-brand-gold/20 bg-black/20 p-6"
        >
          <h2 id="article-references" className="text-xl font-bold text-brand-gold">
            المراجع ومصادر التحقق
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-7 text-brand-cream/80">
            {references.map((reference, index) => (
              <li key={`${reference.url}-${index}`}>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-gold underline decoration-brand-gold/50 underline-offset-4 hover:text-brand-cream"
                >
                  {reference.title}
                </a>
                {reference.sourceType && (
                  <span className="ms-2 text-brand-cream/50">({reference.sourceType})</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center" aria-label="وسوم المقال">
          {article.tags.map(tag => (
            <span
              key={tag}
              className="px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Container>
  );
}

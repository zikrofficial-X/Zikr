import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { getArticleBySlug } from "@/features/articles/services/articles";
import type { Article } from "@/features/articles/types/articles";
import { pageMetadata, siteConfig } from "@/lib/site";
import { estimateReadingMinutes, PUBLIC_CONTENT_THRESHOLDS, splitEditorialParagraphs } from "@/lib/content-quality";
import { getRequestLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const MIN_PUBLIC_ARTICLE_CHARS = PUBLIC_CONTENT_THRESHOLDS.article;

interface ArticleReference {
  url: string;
  title: string;
  sourceType?: string;
}

function getArticleReferences(metadata: Article["metadata"], isEnglish: boolean): ArticleReference[] {
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
            isEnglish
              ? "Open source for verification"
              : typeof item.title_ar === "string" && item.title_ar.trim()
                ? item.title_ar
                : "فتح المصدر للتحقق",
          sourceType:
            !isEnglish && typeof item.source_type === "string" ? item.source_type : undefined,
        },
      ];
    } catch {
      return [];
    }
  });
}

function getMetadataReferences(metadata: Article["metadata"], isEnglish: boolean): ArticleReference[] {
  const sourceUrls = metadata?.source_urls;
  if (!Array.isArray(sourceUrls)) return [];

  return sourceUrls.flatMap(url => {
    if (typeof url !== "string") return [];
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return [];
      return [{ url: parsed.toString(), title: isEnglish ? "Source for verification" : "مصدر للتحقق" }];
    } catch {
      return [];
    }
  });
}

function dedupeReferences(references: ArticleReference[]) {
  return Array.from(new Map(references.map(item => [item.url, item])).values());
}

async function loadArticle(slug: string, locale?: "ar" | "en"): Promise<Article | null> {
  return getArticleBySlug(slug, locale);
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
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const article = await loadArticle(slug, locale);

  if (!article) {
    return pageMetadata({
      title: isEnglish ? "Article not found" : "المقال غير موجود",
      description: isEnglish ? "The requested article was not found on ZIKR." : "لم يتم العثور على المقال المطلوب في منصة ذِكرٌ.",
      path: `/articles/${slug}`,
      noindex: true,
    });
  }

  const qualityApproved = hasSubstantialContent(article);
  const metadata = pageMetadata({
    title: article.title,
    description: article.summary || `اقرأ مقال ${article.title} في منصة ذِكرٌ.`,
    path: `/articles/${article.slug}`,
    noindex: !qualityApproved,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const article = await loadArticle(slug, locale);

  if (!hasSubstantialContent(article)) {
    notFound();
  }

  const references = dedupeReferences([
    ...getArticleReferences(article.metadata, isEnglish),
    ...getMetadataReferences(article.metadata, isEnglish),
  ]);
  const content = article.content.trim();
  const paragraphs = splitEditorialParagraphs(content);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingMinutes = estimateReadingMinutes(content);

  return (
    <Container className="py-12 space-y-8 max-w-3xl" dir={isEnglish ? "ltr" : "rtl"}>
      {article.featuredImageUrl && (
        <div className="w-full h-96 rounded-lg overflow-hidden">
          <Image
            src={article.featuredImageUrl}
            width={800}
            height={384}
            sizes="(max-width: 768px) 100vw, 768px"
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold">{article.title}</h1>
        {article.summary && (
          <p className="text-brand-cream/70 text-lg leading-8">{article.summary}</p>
        )}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-brand-cream/60">
          {article.author && <span>{isEnglish ? "Author: " : "الكاتب: "}{article.author}</span>}
          <time dateTime={article.createdAt}>
            {new Date(article.createdAt).toLocaleDateString(isEnglish ? "en-US" : "ar-SA")}
          </time>
          <span aria-label={isEnglish ? "Approximate reading time" : "مدة القراءة التقريبية"}>{isEnglish ? `Reading: ${readingMinutes} min` : `قراءة: ${readingMinutes} دقيقة`}</span>
          <span>{wordCount.toLocaleString(isEnglish ? "en-US" : "ar-EG")} {isEnglish ? "approx. words" : "كلمة تقريبًا"}</span>
        </div>
      </header>
      <section className="grid gap-4 sm:grid-cols-3" aria-label={isEnglish ? "Reading summary" : "ملخص بيانات القراءة"}>
        <div className="rounded-2xl border border-brand-gold/15 bg-brand-gold/5 p-4 text-center">
          <p className="text-xs text-brand-cream/50">{isEnglish ? "Content type" : "نوع المادة"}</p>
          <p className="mt-2 font-semibold text-brand-gold">{isEnglish ? "Educational editorial" : "مقالة تحريرية تعليمية"}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/15 bg-brand-gold/5 p-4 text-center">
          <p className="text-xs text-brand-cream/50">{isEnglish ? "Available references" : "المراجع المتاحة"}</p>
          <p className="mt-2 font-semibold text-brand-gold">{references.length.toLocaleString("ar-EG")} {isEnglish ? "sources" : "مصدرًا"}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/15 bg-brand-gold/5 p-4 text-center">
          <p className="text-xs text-brand-cream/50">{isEnglish ? "How to use" : "طريقة الاستخدام"}</p>
          <p className="mt-2 font-semibold text-brand-gold">{isEnglish ? "Read, then verify the source" : "اقرأ ثم تحقق من المصدر"}</p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.summary || undefined,
            datePublished: article.createdAt,
            author: { "@type": "Organization", name: article.author || (isEnglish ? "ZIKR Editorial Team" : "فريق ذِكر") },
            publisher: { "@type": "Organization", name: "ZIKR" },
            mainEntityOfPage: `${siteConfig.url}/articles/${article.slug}`,
            keywords: article.tags?.join(", ") || undefined,
          }),
        }}
      />

      <Card className="p-8 space-y-6 bg-black/30 border-brand-gold/30">
        <article className="prose prose-invert max-w-none text-brand-cream leading-9">
          {paragraphs.map((paragraph, index) => (
            <p key={`${article.slug}-paragraph-${index}`} className="mb-6 last:mb-0">
              {paragraph}
            </p>
          ))}
        </article>
      </Card>

      <aside className="rounded-3xl border border-brand-gold/20 bg-brand-gold/5 p-5 text-sm leading-7 text-brand-cream/75">
        {isEnglish
          ? "This is an educational editorial page from the ZIKR team. When transmitting religious or historical information, we provide verification sources where possible. General articles are not personal fatwas or a substitute for qualified scholarly guidance."
          : "هذه صفحة تحريرية تعليمية من فريق ذِكر. عند نقل نص شرعي أو معلومة تاريخية، نضع مصدر التحقق قدر الإمكان، ولا تُعد المقالات العامة فتوى شخصية أو بديلاً عن سؤال أهل العلم."}
      </aside>

      {references.length > 0 && (
        <section
          aria-labelledby="article-references"
          className="rounded-3xl border border-brand-gold/20 bg-black/20 p-6"
        >
          <h2 id="article-references" className="text-xl font-bold text-brand-gold">
            {isEnglish ? "References and verification sources" : "المراجع ومصادر التحقق"}
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
        <div className="flex flex-wrap gap-2 justify-center" aria-label={isEnglish ? "Article tags" : "وسوم المقال"}>
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

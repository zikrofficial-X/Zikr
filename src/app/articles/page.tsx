import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { getArticleCategories, getArticles } from "@/features/articles/services/articles";
import { getRequestLocale } from "@/lib/i18n/server";

export const revalidate = 1800;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return pageMetadata({
title: locale === "en" ? "Islamic Articles" : "المقالات الإسلامية",
    description:
      locale === "en"
        ? "Original editorially reviewed articles about Islam, Quran, Hadith, Seerah, spiritual development, and practical learning."
        : "مقالات أصلية ومراجعة تحريرياً عن الإسلام والقرآن والحديث والسيرة والتزكية والتطبيق العملي من منصة ذِكر.",
    path: "/articles",
  });
}

export default async function ArticlesPage() {
  const locale = await getRequestLocale();
  const isEnglish = locale === "en";
  const [articles, categories] = await Promise.all([
    getArticles(undefined, 100, locale),
    getArticleCategories(),
  ]);

  const categoryCounts = new Map(
    categories.map(category => [
      category.id,
      articles.filter(article => article.categoryId === category.id).length,
    ]),
  );

  return (
    <Container className="py-12 space-y-10" dir={isEnglish ? "ltr" : "rtl"}>
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">المقالات الإسلامية</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          {isEnglish ? "An editorially reviewed article library with one data source shared between the admin area and public site." : "مكتبة مقالات تحريرية قابلة للمراجعة والتحقق، مع مصدر واحد للبيانات بين لوحة الإدارة والواجهة العامة."}
        </p>
      </section>

      {categories.length > 0 && (
        <section className="flex flex-wrap justify-center gap-3" aria-label={isEnglish ? "Article categories" : "تصنيفات المقالات"}>
          {categories.map(category => (
            <span
              key={category.id}
              className="rounded-full border border-brand-gold/30 px-4 py-1.5 text-sm text-brand-cream/70"
            >
              {category.icon && <span className="mr-1">{category.icon}</span>}
              {isEnglish ? category.nameEn : category.nameAr}
              <span className="mr-2 text-brand-gold/70">
                ({categoryCounts.get(category.id) ?? 0})
              </span>
            </span>
          ))}
        </section>
      )}

      <section className="space-y-6">
        <SectionHeader title={isEnglish ? "Published articles" : "المقالات المنشورة"} subtitle={isEnglish ? `${articles.length} articles` : `${articles.length} مقالة`} />

        {articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map(article => (
              <Link key={article.slug} href={`/articles/${article.slug}`}>
                <Card className="h-full flex flex-col hover:border-brand-gold/50 transition-colors">
                  {article.featuredImageUrl ? (
                    <div className="relative w-full h-40 bg-brand-gold/10 rounded-t-xl overflow-hidden">
                      <Image
                        src={article.featuredImageUrl}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-brand-gold/10 to-brand-emerald/10 rounded-t-xl flex items-center justify-center" aria-hidden="true">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-brand-gold/30">
                        <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-5 space-y-3 flex-1 flex flex-col">
                    <h2 className="text-lg font-bold text-brand-gold leading-snug">{article.title}</h2>
                    {article.summary && (
                      <p className="text-brand-cream/70 text-sm leading-relaxed line-clamp-3 flex-1">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-brand-cream/50 pt-3 border-t border-brand-gold/10">
                      {article.author && <span>{article.author}</span>}
                      {article.views > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {article.views.toLocaleString(isEnglish ? "en-US" : "ar-EG")} {isEnglish ? "views" : "مشاهدة"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-brand-cream/70">
            {isEnglish ? "No complete published articles are currently available in this language. Articles appear after editorial and source review." : "لا توجد مقالات منشورة مكتملة حالياً. تُعرض المقالات بعد اكتمال المراجعة التحريرية والمصادر."}
          </Card>
        )}
      </section>

      <Card className="p-8 text-center space-y-4 bg-brand-gold/5">
        <h2 className="text-2xl font-bold text-brand-gold">{isEnglish ? "Content sources and review" : "مصادر ومراجعة المحتوى"}</h2>
        <p className="max-w-xl mx-auto arabic-muted leading-7">
          {isEnglish ? "Completeness, attribution, and source validity come before publication. Review the editorial standards before approving new material." : "اكتمال المادة، وضوح نسبتها، وصلاحية مصادرها تسبق النشر العام. راجع معايير التحرير قبل اعتماد أي مادة جديدة."}
        </p>
        <Link
          href="/editorial-policy"
          className="inline-flex rounded-lg bg-brand-gold px-6 py-2.5 text-sm font-semibold text-brand-emeraldDeep"
        >
          {isEnglish ? "Editorial and source standards" : "معايير التحرير والمصادر"}
        </Link>
      </Card>
    </Container>
  );
}

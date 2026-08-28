export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { staticArticles } from '@/lib/data/articles';
import { mergePublishedBySlug } from '@/lib/data/content-merge';

export const metadata: Metadata = pageMetadata({
  title: 'المقالات الإسلامية',
  description: 'مقالات قيمة عن الإسلام والعقيدة والتطبيق العملي من منصة ذِكر.',
  path: '/articles',
});

export const revalidate = 1800;


interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  author?: string | null;
  featured_image_url?: string | null;
  views: number;
  created_at: string;
  category_id?: string | null;
}

interface ArticleCategory {
  id: string;
  name_ar: string;
  slug: string;
  icon?: string | null;
}


const staticCategories: ArticleCategory[] = [
  { id: 'aqeedah', name_ar: 'العقيدة', slug: 'aqeedah', icon: null },
  { id: 'fiqh', name_ar: 'الفقه', slug: 'fiqh', icon: null },
  { id: 'tazkiyah', name_ar: 'التزكية', slug: 'tazkiyah', icon: null },
  { id: 'history', name_ar: 'التاريخ', slug: 'history', icon: null },
];

export default async function ArticlesPage() {
  let articles: Article[] = [];
  let categories: ArticleCategory[] = [];

  try {
    const supabase = await createClient();
    const [articlesRes, categoriesRes] = await Promise.all([
      supabase
        .from('articles')
        .select('id, title, slug, summary, author, featured_image_url, views, created_at, category_id')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1000),
      supabase
        .from('article_categories')
        .select('id, name_ar, slug, icon')
        .eq('published', true)
        .order('name_ar', { ascending: true }),
    ]);
    articles = articlesRes.data ?? [];
    categories = categoriesRes.data ?? [];
  } catch {
    // Fall through to static content
  }

  const displayArticles = mergePublishedBySlug(articles, staticArticles);
  const displayCategories = mergePublishedBySlug(categories, staticCategories);

  return (
    <Container className="py-12 space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-gold text-balance">المقالات الإسلامية</h1>
        <p className="max-w-2xl mx-auto text-lg leading-8 arabic-muted text-pretty">
          مقالات قيمة عن الإسلام والعقيدة والتطبيق العملي
        </p>
      </section>

      {/* Category Chips */}
      {displayCategories.length > 0 && (
        <section className="flex flex-wrap justify-center gap-3">
          {displayCategories.map((cat) => (
            <span
              key={cat.id}
              className="rounded-full border border-brand-gold/30 px-4 py-1.5 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors cursor-pointer"
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name_ar}
            </span>
          ))}
        </section>
      )}

      {/* Articles Grid */}
      <section className="space-y-6">
        <SectionHeader
          title="المقالات المنشورة"
          subtitle={`${displayArticles.length} مقالة`}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayArticles.map((article) => (
            <Link key={`${article.id}-${article.slug}`} href={`/articles/${article.slug}`}>
              <Card className="h-full flex flex-col hover:border-brand-gold/50 transition-colors cursor-pointer">
                {article.featured_image_url ? (
                  <div className="w-full h-40 bg-brand-gold/10 rounded-t-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-brand-gold/10 to-brand-emerald/10 rounded-t-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-brand-gold/30">
                      <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
                    </svg>
                  </div>
                )}
                <div className="p-5 space-y-3 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-brand-gold leading-snug">{article.title}</h3>
                  {article.summary && (
                    <p className="text-brand-cream/70 text-sm leading-relaxed line-clamp-3 flex-1">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-brand-cream/50 pt-3 border-t border-brand-gold/10">
                    {article.author && <span>{article.author}</span>}
                    {article.views > 0 && (
                      <Badge variant="outline" className="text-[10px]">{article.views.toLocaleString('ar-EG')} مشاهدة</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section>
        <Card className="p-8 text-center space-y-4 bg-brand-gold/5">
          <h2 className="text-2xl font-bold text-brand-gold">ابق على تواصل مع المحتوى</h2>
          <p className="max-w-xl mx-auto arabic-muted leading-7">
            سجّل الدخول لحفظ المقالات المفضلة ومتابعة آخر المنشورات
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg bg-brand-gold px-6 py-2.5 text-sm font-semibold text-brand-emeraldDeep hover:bg-brand-goldSoft transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/search"
              className="rounded-lg border border-brand-gold/30 px-6 py-2.5 text-sm text-brand-cream/70 hover:border-brand-gold hover:text-brand-gold transition-colors"
            >
              البحث في المحتوى
            </Link>
          </div>
        </Card>
      </section>
    </Container>
  );
}

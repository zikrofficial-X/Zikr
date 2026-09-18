import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";

// Articles
export async function getArticleCategories(): Promise<ArticleCategory[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/article_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&order=name_ar.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch article categories:", error);
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    nameAr: r.name_ar as string,
    nameEn: r.name_en as string,
    slug: r.slug as string,
    icon: r.icon as string | undefined,
  }));
}

export async function getArticles(
  categoryId?: string,
  limit = 20
): Promise<Article[]> {
  let query =
    "/rest/v1/articles?select=id,title,slug,summary,content,author,featured_image_url,views,published,category_id,tags,metadata,created_at&published=eq.true&order=created_at.desc";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
  }

  query += `&limit=${Math.max(1, Math.min(100, limit))}`;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    query
  ).catch(error => {
    console.error("[content] Failed to fetch articles:", error);
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    summary: r.summary as string | undefined,
    content: r.content as string | undefined,
    author: r.author as string | undefined,
    featuredImageUrl: r.featured_image_url as string | undefined,
    views: (r.views as number) || 0,
    published: r.published as boolean,
    categoryId: r.category_id as string | undefined,
    tags: r.tags as string[] | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  }));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const safeSlug = encodeURIComponent(slug);
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/articles?select=*&slug=eq.${safeSlug}&published=eq.true&limit=1`
  ).catch(error => {
    console.error("[content] Failed to fetch article by slug:", error);
    return [];
  });

  if (!rows.length) return null;
  const r = rows[0];

  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    summary: r.summary as string | undefined,
    content: r.content as string | undefined,
    author: r.author as string | undefined,
    featuredImageUrl: r.featured_image_url as string | undefined,
    views: (r.views as number) || 0,
    published: r.published as boolean,
    categoryId: r.category_id as string | undefined,
    tags: r.tags as string[] | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  };
}


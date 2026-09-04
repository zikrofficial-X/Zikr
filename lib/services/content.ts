import { supabaseServerAnonRequest } from "@/lib/supabase/server";

export interface ArticleCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  author?: string;
  featuredImageUrl?: string;
  views: number;
  published: boolean;
  categoryId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface VideoCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description?: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  duration?: number;
  views: number;
  published: boolean;
  categoryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

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
    query += `&category_id=eq.${categoryId}`;
  }

  query += `&limit=${limit}`;

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
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/articles?select=*&slug=eq.${slug}&published=eq.true&limit=1`
  ).catch(() => []);

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

// Videos
export async function getVideoCategories(): Promise<VideoCategory[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/video_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&order=name_ar.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch video categories:", error);
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

export async function getVideos(
  categoryId?: string,
  limit = 20
): Promise<Video[]> {
  let query =
    "/rest/v1/videos?select=id,title,slug,description,youtube_id,thumbnail_url,duration,views,published,category_id,metadata,created_at&published=eq.true&order=created_at.desc";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${categoryId}`;
  }

  query += `&limit=${limit}`;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    query
  ).catch(error => {
    console.error("[content] Failed to fetch videos:", error);
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    description: r.description as string | undefined,
    youtubeId: r.youtube_id as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    duration: (r.duration as number) || undefined,
    views: (r.views as number) || 0,
    published: r.published as boolean,
    categoryId: r.category_id as string | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  }));
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/videos?select=*&slug=eq.${slug}&published=eq.true&limit=1`
  ).catch(() => []);

  if (!rows.length) return null;
  const r = rows[0];

  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    description: r.description as string | undefined,
    youtubeId: r.youtube_id as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    duration: (r.duration as number) || undefined,
    views: (r.views as number) || 0,
    published: r.published as boolean,
    categoryId: r.category_id as string | undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.created_at as string,
  };
}

// Duas
export interface DuaCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon?: string;
}

export interface Dua {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  textAr: string;
import {
  isSupabaseConfigured,
  supabaseServerAnonRequest,
} from "@/lib/supabase/server";

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

// Videos
export async function getVideoCategories(): Promise<VideoCategory[]> {
  if (!isSupabaseConfigured()) return [];
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
  if (!isSupabaseConfigured()) return [];
  let query =
    "/rest/v1/videos?select=id,title,slug,description,youtube_id,thumbnail_url,duration,views,published,category_id,metadata,created_at&published=eq.true&order=created_at.desc";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
  }

  query += `&limit=${Math.max(1, Math.min(100, limit))}`;

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
  const safeSlug = encodeURIComponent(slug);
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/videos?select=*&slug=eq.${safeSlug}&published=eq.true&limit=1`
  ).catch(error => {
    console.error("[content] Failed to fetch video by slug:", error);
    return [];
  });

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
  textEn?: string;
  occasionAr?: string;
  sourceAr?: string;
  benefitsAr?: string;
  categoryId?: string;
  published: boolean;
}

export async function getDuaCategories(): Promise<DuaCategory[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/dua_categories?select=id,name_ar,name_en,slug,icon&published=eq.true&order=name_ar.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch dua categories:", error);
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

export async function getDuas(categoryId?: string, limit = 50): Promise<Dua[]> {
  let query =
    "/rest/v1/duas?select=id,title_ar,title_en,slug,text_ar,occasion_ar,source_ar,benefits_ar,category_id,published&published=eq.true";

  if (categoryId && categoryId !== "all") {
    query += `&category_id=eq.${encodeURIComponent(categoryId)}`;
  }

  query += `&limit=${Math.max(1, Math.min(100, limit))}`;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    query
  ).catch(error => {
    console.error("[content] Failed to fetch duas:", error);
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    titleAr: r.title_ar as string,
    titleEn: r.title_en as string,
    slug: r.slug as string,
    textAr: r.text_ar as string,
    occasionAr: r.occasion_ar as string | undefined,
    sourceAr: r.source_ar as string | undefined,
    benefitsAr: r.benefits_ar as string | undefined,
    categoryId: r.category_id as string | undefined,
    published: r.published as boolean,
  }));
}

export async function getDuaBySlug(slug: string): Promise<Dua | null> {
  const safeSlug = encodeURIComponent(slug);
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/duas?select=*&slug=eq.${safeSlug}&published=eq.true&limit=1`
  ).catch(error => {
    console.error("[content] Failed to fetch dua by slug:", error);
    return [];
  });

  if (!rows.length) return null;
  const r = rows[0];

  return {
    id: r.id as string,
    titleAr: r.title_ar as string,
    titleEn: r.title_en as string,
    slug: r.slug as string,
    textAr: r.text_ar as string,
    textEn: r.text_en as string | undefined,
    occasionAr: r.occasion_ar as string | undefined,
    sourceAr: r.source_ar as string | undefined,
    benefitsAr: r.benefits_ar as string | undefined,
    categoryId: r.category_id as string | undefined,
    published: r.published as boolean,
  };
}

// Prophets
export interface Prophet {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  bioAr?: string;
  featuredImageUrl?: string;
  thumbnailUrl?: string;
  orderNum?: number;
  published: boolean;
}

export async function getProphets(): Promise<Prophet[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    "/rest/v1/prophets?select=*&published=eq.true&order=order_num.asc"
  ).catch(error => {
    console.error("[content] Failed to fetch prophets:", error);
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    nameAr: r.name_ar as string,
    nameEn: r.name_en as string,
    slug: r.slug as string,
    bioAr: r.bio_ar as string | undefined,
    featuredImageUrl: r.featured_image_url as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    orderNum: r.order_num as number | undefined,
    published: r.published as boolean,
  }));
}

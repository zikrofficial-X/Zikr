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
    query += `&category_id=eq.${categoryId}`;
  }

  query += `&limit=${limit}`;

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
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/duas?select=*&slug=eq.${slug}&published=eq.true&limit=1`
  ).catch(() => []);

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

export async function getProphetBySlug(slug: string): Promise<Prophet | null> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/prophets?select=*&slug=eq.${slug}&published=eq.true&limit=1`
  ).catch(() => []);

  if (!rows.length) return null;
  const r = rows[0];

  return {
    id: r.id as string,
    nameAr: r.name_ar as string,
    nameEn: r.name_en as string,
    slug: r.slug as string,
    bioAr: r.bio_ar as string | undefined,
    featuredImageUrl: r.featured_image_url as string | undefined,
    thumbnailUrl: r.thumbnail_url as string | undefined,
    orderNum: r.order_num as number | undefined,
    published: r.published as boolean,
  };
}

// Prophet Sections
export interface ProphetSection {
  id: string;
  titleAr?: string;
  titleEn?: string;
  contentAr?: string;
  contentEn?: string;
  sectionType?: string;
  orderNum?: number;
}

export async function getProphetSections(
  prophetId: string
): Promise<ProphetSection[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/prophet_sections?select=*&prophet_id=eq.${prophetId}&order=order_num.asc`
  ).catch(error => {
    console.error(
      "[content] Failed to fetch prophet sections for",
      prophetId,
      ":",
      error
    );
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    titleAr: r.title_ar as string | undefined,
    titleEn: r.title_en as string | undefined,
    contentAr: r.content_ar as string | undefined,
    contentEn: r.content_en as string | undefined,
    sectionType: r.section_type as string | undefined,
    orderNum: r.order_num as number | undefined,
  }));
}

// Kids Content
export interface KidsContent {
  id: string;
  titleAr?: string;
  slug: string;
  type?: string;
  ageGroup?: string;
  featuredImageUrl?: string;
  contentAr?: string;
  videoUrl?: string;
  quiz_data?: Record<string, unknown>;
  published: boolean;
  createdAt: string;
}

export async function getKidsContent(
  ageGroup?: string,
  type?: string,
  limit = 50
): Promise<KidsContent[]> {
  let query =
    "/rest/v1/kids_content?select=*&published=eq.true&order=created_at.desc";

  if (ageGroup && ageGroup !== "all") {
    query += `&age_group=eq.${ageGroup}`;
  }

  if (type && type !== "all") {
    query += `&type=eq.${type}`;
  }

  query += `&limit=${limit}`;

  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    query
  ).catch(error => {
    console.error("[content] Failed to fetch kids content:", error);
    return [];
  });

  return rows.map(r => ({
    id: r.id as string,
    titleAr: r.title_ar as string | undefined,
    slug: r.slug as string,
    type: r.type as string | undefined,
    ageGroup: r.age_group as string | undefined,
    featuredImageUrl: r.featured_image_url as string | undefined,
    contentAr: r.content_ar as string | undefined,
    videoUrl: r.video_url as string | undefined,
    quiz_data: r.quiz_data as Record<string, unknown> | undefined,
    published: r.published as boolean,
    createdAt: r.created_at as string,
  }));
}

// ─── Battles ──────────────────────────────────────────────────────────────────
export interface Battle {
  id: string;
  slug: string;
  name_ar?: string;
  published: boolean;
}

export async function getBattles(limit = 100): Promise<Battle[]> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/battles?select=id,slug,name_ar,published&published=eq.true&order=year_hijri.asc&limit=${limit}`
  ).catch(() => []);
  return (rows ?? []).map(r => ({
    id: r.id as string,
    slug: r.slug as string,
    name_ar: r.name_ar as string | undefined,
    published: r.published as boolean,
  }));
}

// ─── Kids Content ─────────────────────────────────────────────────────────────
export async function getKidsContentBySlug(
  slug: string
): Promise<KidsContent | null> {
  const rows = await supabaseServerAnonRequest<Array<Record<string, unknown>>>(
    `/rest/v1/kids_content?select=*&slug=eq.${slug}&published=eq.true&limit=1`
  ).catch(() => []);

  if (!rows.length) return null;
  const r = rows[0];

  return {
    id: r.id as string,
    titleAr: r.title_ar as string | undefined,
    slug: r.slug as string,
    type: r.type as string | undefined,
    ageGroup: r.age_group as string | undefined,
    featuredImageUrl: r.featured_image_url as string | undefined,
    contentAr: r.content_ar as string | undefined,
    videoUrl: r.video_url as string | undefined,
    quiz_data: r.quiz_data as Record<string, unknown> | undefined,
    published: r.published as boolean,
    createdAt: r.created_at as string,
  };
}

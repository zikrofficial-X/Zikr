import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";

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


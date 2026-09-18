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


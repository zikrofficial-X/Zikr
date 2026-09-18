export interface Scholar {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr?: string;
  bioEn?: string;
  thumbnailUrl?: string;
  websiteUrl?: string;
  youtubeUrl?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}


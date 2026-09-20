export interface Prophet {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  bioAr?: string;
  bioEn?: string;
  birthPlaceAr?: string;
  deathPlaceAr?: string;
  featuredImageUrl?: string;
  thumbnailUrl?: string;
  orderNum?: number;
  metadata?: Record<string, unknown> | null;
  published: boolean;
}

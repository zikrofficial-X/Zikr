import "server-only";

import { readAdminRows } from "@/features/admin/services/safe-read";

export type KnowledgeCompanion = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  bio_ar: string;
  bio_en: string | null;
  category: string | null;
  thumbnail_url: string | null;
  featured_image_url: string | null;
  order_num: number | null;
  published: boolean;
  metadata: Record<string, unknown> | null;
};

export type KnowledgeScholar = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  bio_ar: string;
  bio_en: string | null;
  thumbnail_url: string | null;
  website_url: string | null;
  youtube_url: string | null;
  published: boolean;
};

export type KnowledgeSurah = {
  id: number;
  name_ar: string;
  name_en: string | null;
  name_translation: string | null;
  slug: string;
  order: number;
  ayahs_count: number;
  revelation_place: string | null;
};

export type KnowledgeHadith = {
  id: string;
  book_id: string;
  hadith_number: string | number | null;
  text_ar: string;
  text_en: string | null;
  narrator_ar: string | null;
  narrator_en: string | null;
  chapter: string | null;
  grade_ar: string | null;
  grade_en: string | null;
  ref: string | null;
  published: boolean;
};

export type KnowledgeBook = {
  id: string;
  name_ar: string;
  name_en: string;
};

export type KnowledgeAdminData = {
  companions: KnowledgeCompanion[];
  scholars: KnowledgeScholar[];
  surahs: KnowledgeSurah[];
  hadiths: KnowledgeHadith[];
  books: KnowledgeBook[];
  availability: {
    companions: boolean;
    scholars: boolean;
    surahs: boolean;
    hadiths: boolean;
    books: boolean;
  };
  errors: {
    companions: string | null;
    scholars: string | null;
    surahs: string | null;
    hadiths: string | null;
    books: string | null;
  };
};

export async function getKnowledgeAdminData(): Promise<KnowledgeAdminData> {
  const [companions, scholars, surahs, hadiths, books] = await Promise.all([
    readAdminRows<KnowledgeCompanion>(
      "/rest/v1/companions?select=id,name_ar,name_en,slug,bio_ar,bio_en,category,thumbnail_url,featured_image_url,order_num,published,metadata&order=order_num.asc&limit=100",
    ),
    readAdminRows<KnowledgeScholar>(
      "/rest/v1/scholars?select=id,name_ar,name_en,slug,bio_ar,bio_en,thumbnail_url,website_url,youtube_url,published&order=created_at.desc&limit=100",
    ),
    readAdminRows<KnowledgeSurah>(
      "/rest/v1/quran_surahs?select=id,name_ar,name_en,name_translation,slug,order,ayahs_count,revelation_place&order=order.asc&limit=114",
    ),
    readAdminRows<KnowledgeHadith>(
      "/rest/v1/hadiths?select=id,book_id,hadith_number,text_ar,text_en,narrator_ar,narrator_en,chapter,grade_ar,grade_en,ref,published&order=created_at.desc&limit=12",
    ),
    readAdminRows<KnowledgeBook>(
      "/rest/v1/hadith_books?select=id,name_ar,name_en&order=name_ar.asc&limit=100",
    ),
  ]);

  return {
    companions: companions.rows,
    scholars: scholars.rows,
    surahs: surahs.rows,
    hadiths: hadiths.rows,
    books: books.rows,
    availability: {
      companions: !companions.error,
      scholars: !scholars.error,
      surahs: !surahs.error,
      hadiths: !hadiths.error,
      books: !books.error,
    },
    errors: {
      companions: companions.error,
      scholars: scholars.error,
      surahs: surahs.error,
      hadiths: hadiths.error,
      books: books.error,
    },
  };
}

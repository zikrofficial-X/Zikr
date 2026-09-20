import "server-only";

import { createClient } from "@/lib/supabase/server";

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
};

export async function getKnowledgeAdminData(): Promise<KnowledgeAdminData> {
  const supabase = await createClient();

  const [companions, scholars, surahs, hadiths, books] =
    await Promise.all([
      supabase
        .from("companions")
        .select(
          "id,name_ar,name_en,slug,bio_ar,bio_en,category,thumbnail_url,featured_image_url,order_num,published,metadata",
        )
        .order("order_num", { ascending: true })
        .limit(12),
      supabase
        .from("scholars")
        .select(
          "id,name_ar,name_en,slug,bio_ar,bio_en,thumbnail_url,website_url,youtube_url,published",
        )
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("quran_surahs")
        .select(
          "id,name_ar,name_en,name_translation,slug,order,ayahs_count,revelation_place",
        )
        .order("order", { ascending: true })
        .limit(20),
      supabase
        .from("hadiths")
        .select(
          "id,book_id,hadith_number,text_ar,text_en,narrator_ar,narrator_en,chapter,grade_ar,grade_en,ref,published",
        )
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("hadith_books")
        .select("id,name_ar,name_en")
        .order("name_ar", { ascending: true })
        .limit(100),
    ]);

  return {
    companions: (companions.data ?? []) as KnowledgeCompanion[],
    scholars: (scholars.data ?? []) as KnowledgeScholar[],
    surahs: (surahs.data ?? []) as KnowledgeSurah[],
    hadiths: (hadiths.data ?? []) as KnowledgeHadith[],
    books: (books.data ?? []) as KnowledgeBook[],
  };
}

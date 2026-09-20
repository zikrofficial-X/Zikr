import "server-only";

import { createClient } from "@/lib/supabase/server";

export type KnowledgeAdminData = {
  companions: Array<Record<string, unknown>>;
  scholars: Array<Record<string, unknown>>;
  surahs: Array<Record<string, unknown>>;
  hadiths: Array<Record<string, unknown>>;
  books: Array<Record<string, unknown>>;
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
    companions: companions.data ?? [],
    scholars: scholars.data ?? [],
    surahs: surahs.data ?? [],
    hadiths: hadiths.data ?? [],
    books: books.data ?? [],
  };
}

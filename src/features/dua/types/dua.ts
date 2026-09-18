import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";

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


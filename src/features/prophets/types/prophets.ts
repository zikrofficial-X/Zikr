import { isSupabaseConfigured, supabaseServerAnonRequest } from "@/lib/supabase/server";

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


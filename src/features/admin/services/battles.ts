import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminBattle = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  year_hijri: number | null;
  published: boolean;
  metadata: Record<string, string> | null;
};

export const ADMIN_STATIC_BATTLES = [
  { slug: "badr", name_ar: "غزوة بدر الكبرى", year_hijri: 2 },
  { slug: "uhud", name_ar: "غزوة أحد", year_hijri: 3 },
  { slug: "khandaq", name_ar: "غزوة الخندق (الأحزاب)", year_hijri: 5 },
  { slug: "khaybar", name_ar: "غزوة خيبر", year_hijri: 7 },
  { slug: "hunayn", name_ar: "غزوة حنين", year_hijri: 8 },
  { slug: "tabuk", name_ar: "غزوة تبوك", year_hijri: 9 },
] as const;

export async function getAdminBattles(): Promise<AdminBattle[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("battles")
      .select("id,name_ar,name_en,slug,year_hijri,published,metadata")
      .order("year_hijri", { ascending: true });
    return data ?? [];
  } catch (error) {
    console.error("[admin/battles] failed to load battles:", error);
    return [];
  }
}

import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminProphet = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  order_num: number | null;
  published: boolean;
  bio_ar: string | null;
  metadata: Record<string, string> | null;
};

export const ADMIN_STATIC_PROPHETS = [
  { slug: "adam", name_ar: "آدم عليه السلام", order_num: 1 },
  { slug: "nuh", name_ar: "نوح عليه السلام", order_num: 3 },
  { slug: "ibrahim", name_ar: "إبراهيم عليه السلام", order_num: 6 },
  { slug: "yusuf", name_ar: "يوسف عليه السلام", order_num: 11 },
  { slug: "musa", name_ar: "موسى عليه السلام", order_num: 15 },
  { slug: "isa", name_ar: "عيسى عليه السلام", order_num: 24 },
  { slug: "muhammad", name_ar: "محمد صلى الله عليه وسلم", order_num: 25 },
] as const;

export async function getAdminProphets(): Promise<AdminProphet[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("prophets")
      .select("id,name_ar,name_en,slug,order_num,published,bio_ar,metadata")
      .order("order_num", { ascending: true });
    return data ?? [];
  } catch (error) {
    console.error("[admin/prophets] failed to load prophets:", error);
    return [];
  }
}

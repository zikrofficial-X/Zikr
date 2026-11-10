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

export type AdminProphetsReadResult = {
  rows: AdminProphet[];
  ok: boolean;
};

export async function getAdminProphets(): Promise<AdminProphetsReadResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("prophets")
      .select("id,name_ar,name_en,slug,order_num,published,bio_ar,metadata")
      .order("order_num", { ascending: true });
    if (error) {
      console.error("[admin/prophets] failed to load prophets:", error);
      return { rows: [], ok: false };
    }
    return { rows: data ?? [], ok: true };
  } catch (error) {
    console.error("[admin/prophets] failed to load prophets:", error);
    return { rows: [], ok: false };
  }
}

export async function saveAdminProphetVideo(
  id: string,
  videoId: string | null,
): Promise<boolean> {
  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("prophets")
    .select("metadata")
    .eq("id", id)
    .single();

  if (readError || !current) return false;

  const existingMeta =
    (current.metadata as Record<string, string> | null) ?? {};
  const metadata = videoId
    ? { ...existingMeta, youtube_video_id: videoId }
    : Object.fromEntries(
        Object.entries(existingMeta).filter(
          ([key]) => key !== "youtube_video_id",
        ),
      );

  const { error } = await supabase
    .from("prophets")
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[admin/prophets] failed to save video:", error);
    return false;
  }

  return true;
}

export async function setAdminProphetPublished(
  id: string,
  published: boolean,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("prophets")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[admin/prophets] failed to update published state:", error);
    return false;
  }

  return true;
}

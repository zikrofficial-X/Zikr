import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

export type SiteAudioAsset = {
  title: string | null;
  url: string;
  updatedAt: string | null;
};

const TABLE_PATH =
  "/rest/v1/site_audio_assets?select=kind,title,storage_path,updated_at&is_primary=eq.true";

export async function getPrimarySiteAudioAssets(): Promise<Record<string, SiteAudioAsset>> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("site_audio_assets")
    .select("kind,title,storage_path,updated_at")
    .eq("is_primary", true);

  if (error) throw error;

  return Object.fromEntries(
    (data ?? [])
      .filter((asset) => asset.kind && asset.storage_path)
      .map((asset) => [
        asset.kind,
        {
          title: asset.title ?? null,
          url: db.storage
            .from("site-audio")
            .getPublicUrl(asset.storage_path)
            .data.publicUrl,
          updatedAt: asset.updated_at ?? null,
        },
      ]),
  );
}

export { TABLE_PATH };

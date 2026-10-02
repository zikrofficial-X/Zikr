import "server-only";

import { createAdminClient } from "@/lib/supabase/server";
import { getCuratedAudioByStoragePath } from "@/lib/audio/curated-library";

export type SiteAudioAsset = {
  id: string;
  kind: "adhan" | "salawat" | "dhikr";
  title: string | null;
  url: string;
  updatedAt: string | null;
  isPrimary: boolean;
  isHuman: boolean;
  sourceUrl: string | null;
  sourceName: string | null;
  license: string | null;
  attribution: string | null;
  isCurated: boolean;
};

function resolveAudio(storagePath: string, db: ReturnType<typeof createAdminClient>) {
  const curated = getCuratedAudioByStoragePath(storagePath);
  if (curated) {
    return {
      url: curated.webUrl,
      isHuman: true,
      sourceUrl: curated.sourceUrl,
      sourceName: curated.sourceName,
      license: curated.license,
      attribution: curated.attribution ?? null,
      isCurated: true,
    };
  }

  if (/^https?:\/\//i.test(storagePath)) {
    return {
      url: storagePath,
      isHuman: false,
      sourceUrl: storagePath,
      sourceName: "مصدر خارجي",
      license: null,
      attribution: null,
      isCurated: false,
    };
  }

  return {
    url: db.storage.from("site-audio").getPublicUrl(storagePath).data.publicUrl,
    isHuman: false,
    sourceUrl: null,
    sourceName: null,
    license: null,
    attribution: null,
    isCurated: false,
  };
}

export async function getSiteAudioLibrary(): Promise<SiteAudioAsset[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("site_audio_assets")
    .select("id,kind,title,storage_path,is_primary,updated_at,created_at")
    .in("kind", ["adhan", "salawat", "dhikr"])
    .order("kind", { ascending: true })
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(asset => {
    const resolved = resolveAudio(asset.storage_path, db);
    return {
      id: asset.id,
      kind: asset.kind as SiteAudioAsset["kind"],
      title: asset.title ?? null,
      updatedAt: asset.updated_at ?? null,
      isPrimary: Boolean(asset.is_primary),
      ...resolved,
    };
  });
}

export async function getPrimarySiteAudioAssets(): Promise<Record<string, SiteAudioAsset>> {
  const library = await getSiteAudioLibrary();
  return Object.fromEntries(library.filter(asset => asset.isPrimary).map(asset => [asset.kind, asset]));
}

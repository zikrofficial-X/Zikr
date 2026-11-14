import { getOfflineDataset } from "@/lib/offline-pack";
import { normalizeKidsContentRow, type KidsItem } from "@/features/kids/data/content";
import { isKidsContentType } from "@/features/kids/services/kids-content-validation";

export type KidsOfflineLocale = "ar" | "en";

/**
 * Use the last validated offline snapshot only when the server response is
 * transient. A 404 or authorization failure must not resurrect hidden content.
 */
export function shouldUseOfflineKidsContentForStatus(status: number): boolean {
  return Number.isInteger(status) &&
    (status === 408 || status === 429 || (status >= 500 && status <= 599));
}

export function normalizeOfflineKidsRows(rows: unknown[], locale: KidsOfflineLocale = "ar"): KidsItem[] {
  const items = rows
    .map((row) => normalizeKidsContentRow(row as Parameters<typeof normalizeKidsContentRow>[0]))
    .filter((item): item is KidsItem => item !== null && isKidsContentType(item.type))
    // The offline exporter intentionally requires explicit age approval for
    // stories; keep that safety gate even if an older local snapshot remains.
    .filter((item) => item.type !== "story" || (item.metadata as Record<string, unknown> | undefined)?.age_appropriate === true);

  return locale === "en"
    ? items.filter((item) => Boolean(item.title_en?.trim() && item.content_en?.trim()))
    : items;
}

export async function getOfflineKidsContent(locale: KidsOfflineLocale = "ar"): Promise<KidsItem[]> {
  try {
    return normalizeOfflineKidsRows(await getOfflineDataset<unknown>("kids"), locale);
  } catch {
    return [];
  }
}

export async function getOfflineKidsContentBySlug(
  slug: string,
  locale: KidsOfflineLocale = "ar",
): Promise<KidsItem | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) return null;
  const items = await getOfflineKidsContent(locale);
  return items.find((item) => item.slug.trim().toLowerCase() === normalizedSlug) ?? null;
}

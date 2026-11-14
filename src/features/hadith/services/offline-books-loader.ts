import { resolveHadithBookName, type HadithBook } from "../types/hadith";

export type OfflineHadithBookRow = {
  slug?: string;
  name_ar?: string;
  name_en?: string | null;
  hadith_count?: number | null;
};

/**
 * Cache the locale-neutral source rows, not localized view models. The same
 * process can serve Arabic and English requests in either order.
 */
export function createOfflineHadithBooksLoader(
  loadRows: () => Promise<OfflineHadithBookRow[]>,
) {
  let rowsPromise: Promise<OfflineHadithBookRow[]> | null = null;

  return async (locale: "ar" | "en" = "ar"): Promise<HadithBook[]> => {
    if (!rowsPromise) rowsPromise = loadRows();

    let rows: OfflineHadithBookRow[];
    try {
      rows = await rowsPromise;
    } catch (error) {
      rowsPromise = null;
      throw error;
    }

    return rows
      .filter((row) => row.slug && row.name_ar)
      .map((row) => ({
        id: String(row.slug),
        slug: String(row.slug),
        name: resolveHadithBookName(
          String(row.name_ar),
          row.name_en ?? null,
          locale,
        ),
        nameAr: String(row.name_ar).trim(),
        nameEn: row.name_en?.trim() || undefined,
        available: Number(row.hadith_count) || 0,
      }));
  };
}

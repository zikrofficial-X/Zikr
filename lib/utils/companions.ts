export type CompanionSummary = {
  id: string;
  name_ar: string;
  category: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  khulafa: 'الخلفاء الراشدون',
  sabiqun: 'السابقون إلى الإسلام',
  qada: 'القادة',
};

export function companionCategoryLabel(category: string | null) {
  if (!category) return 'الصحابة الكرام';
  return CATEGORY_LABELS[category] ?? category;
}

function normalizedName(name: string) {
  return name.trim().replace(/[\u064B-\u065F\u0670]/g, '').replace(/\s+/g, ' ');
}

/**
 * Historical imports created alternate slugs for several companions. Prefer the
 * categorized source row and keep all source rows untouched in the database.
 */
export function uniqueCompanionSummaries<T extends CompanionSummary>(rows: T[]) {
  const unique = new Map<string, T>();

  for (const row of rows) {
    const key = normalizedName(row.name_ar);
    const existing = unique.get(key);
    if (!existing || (!existing.category && row.category)) {
      unique.set(key, row);
    }
  }

  return [...unique.values()];
}

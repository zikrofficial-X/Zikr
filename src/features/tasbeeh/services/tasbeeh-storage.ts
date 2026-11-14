import type { TasbeehItem } from "./tasbeeh";

const TASBEEH_CATEGORIES = new Set<TasbeehItem["category"]>([
  "morning",
  "evening",
  "prayer",
  "custom",
]);

export function isTasbeehTabLoaded<T extends string>(
  activeTab: T,
  loadedTab: T | null,
): boolean {
  return activeTab === loadedTab;
}

export function isTasbeehItemArray(value: unknown): value is TasbeehItem[] {
  if (!Array.isArray(value)) return false;

  const seenIds = new Set<string>();
  return value.every((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;

    const item = candidate as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    if (!id || item.id !== id || seenIds.has(id)) return false;
    if (typeof item.name !== "string" || !item.name.trim()) return false;
    if (typeof item.nameAr !== "string" || !item.nameAr.trim()) return false;
    if (typeof item.text !== "string" || !item.text.trim()) return false;
    if (typeof item.textAr !== "string" || !item.textAr.trim()) return false;
    if (!Number.isSafeInteger(item.count) || (item.count as number) < 0) return false;
    if (
      item.targetCount !== undefined &&
      (!Number.isSafeInteger(item.targetCount) || (item.targetCount as number) < 1)
    ) return false;
    if (!TASBEEH_CATEGORIES.has(item.category as TasbeehItem["category"])) return false;

    seenIds.add(id);
    return true;
  });
}

export function shouldPersistTasbeehItems<T extends string>(
  activeTab: T,
  loadedTab: T | null,
  persistenceAllowed: boolean,
): boolean {
  return persistenceAllowed && isTasbeehTabLoaded(activeTab, loadedTab);
}

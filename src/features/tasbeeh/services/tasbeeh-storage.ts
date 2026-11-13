export function isTasbeehTabLoaded<T extends string>(
  activeTab: T,
  loadedTab: T | null,
): boolean {
  return activeTab === loadedTab;
}

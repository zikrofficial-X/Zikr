export type PublicContentTable = "articles" | "duas" | "prophets";
export type DatabasePublicationState = "published" | "unpublished" | "missing" | "unknown";

/**
 * If the database says a slug is unpublished, or its state cannot be verified,
 * do not resurrect a stale offline snapshot. Missing rows and published rows
 * may still use the existing static fallback behavior.
 */
export function shouldSuppressOfflineFallback(state: DatabasePublicationState): boolean {
  return state === "unpublished" || state === "unknown";
}

export function resolveSafeOfflineRoute(route: unknown, origin: string): URL | null {
  if (
    typeof route !== "string" ||
    !route.startsWith("/") ||
    route.startsWith("//") ||
    route.includes("\\") ||
    /%(?:2f|5c)/i.test(route)
  ) {
    return null;
  }

  try {
    const baseOrigin = new URL(origin).origin;
    const url = new URL(route, baseOrigin);
    if (
      url.origin !== baseOrigin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

const SAFE_KIDS_CONTENT_TYPES = new Set(["activity", "game", "quiz", "story", "video", "wudu"]);

export function getPublishedKidsOfflineRoutes(rows: unknown[]): string[] {
  const routes = new Set<string>();
  for (const value of Array.isArray(rows) ? rows : []) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const type = typeof row.type === "string"
      ? row.type
      : typeof row.content_type === "string" ? row.content_type : "";
    const slug = typeof row.slug === "string" ? row.slug.trim() : "";
    const metadata = row.metadata && typeof row.metadata === "object"
      ? row.metadata as Record<string, unknown>
      : {};
    if (!SAFE_KIDS_CONTENT_TYPES.has(type)) continue;
    if (type === "story" && metadata.age_appropriate !== true) continue;
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) continue;
    routes.add(`/kids/${slug}`);
  }
  return [...routes].sort();
}

export function filterOfflineSupplementalKidsRoutes(
  routes: string[],
  publishedKidsRoutes: string[],
): string[] {
  const allowed = new Set(publishedKidsRoutes);
  return routes.filter((route) => {
    const match = /^\/kids\/([^/]+)$/.exec(route);
    if (!match) return true;
    const slug = match[1];
    const isStoryRoute = slug.startsWith("story-") || slug.startsWith("zikr-kids-");
    return !isStoryRoute || allowed.has(route);
  });
}

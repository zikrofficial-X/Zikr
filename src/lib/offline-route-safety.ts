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

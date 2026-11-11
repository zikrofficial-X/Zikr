export function getSafeInternalPath(
  next: string | null | undefined,
  baseOrigin: string,
): string {
  const fallback = "/profile";
  if (typeof next !== "string") return fallback;

  const candidate = next.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;

  try {
    const base = new URL(baseOrigin);
    const target = new URL(candidate, base);
    if (target.origin !== base.origin) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}

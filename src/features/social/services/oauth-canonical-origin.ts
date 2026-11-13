export function buildCanonicalOAuthStartRedirect(
  requestUrl: string,
  canonicalUrl: string,
): string | null {
  const request = new URL(requestUrl);
  const canonical = new URL(canonicalUrl);

  if (request.origin === canonical.origin) return null;

  const target = new URL(
    request.pathname + request.search + request.hash,
    canonical.origin,
  );
  return target.toString();
}

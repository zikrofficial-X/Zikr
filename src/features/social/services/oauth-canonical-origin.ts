export function buildCanonicalOAuthStartRedirect(
  requestUrl: string,
  canonicalUrl: string,
): string | null {
  const request = new URL(requestUrl);
  const canonical = new URL(canonicalUrl);

  if (request.origin === canonical.origin) return null;

  const target = new URL(requestUrl);
  target.protocol = canonical.protocol;
  target.host = canonical.host;
  target.username = "";
  target.password = "";
  return target.toString();
}

const SAFE_REDIRECT_ORIGIN = "https://zikr.invalid";
const DEFAULT_INTERNAL_PATH = "/profile";

/**
 * Normalize an untrusted post-authentication path to a same-origin path.
 * Raw backslashes are rejected because browsers normalize them as slashes in
 * special URLs, which can turn "/\\\\attacker.example" into an external URL.
 */
export function sanitizeInternalPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim() ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    return DEFAULT_INTERNAL_PATH;
  }

  try {
    const url = new URL(value, SAFE_REDIRECT_ORIGIN);
    if (url.origin !== SAFE_REDIRECT_ORIGIN || !url.pathname.startsWith("/")) {
      return DEFAULT_INTERNAL_PATH;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_INTERNAL_PATH;
  }
}

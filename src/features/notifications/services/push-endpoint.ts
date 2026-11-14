const EXACT_PUSH_SERVICE_HOSTS = new Set([
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
  "push.services.opera.com",
]);

/**
 * Accept only HTTPS endpoints belonging to supported browser push services.
 * Push endpoints are later used by the server-side Web Push client, so an
 * arbitrary caller-supplied HTTPS URL would turn the worker into an SSRF proxy.
 */
export function isAllowedPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 4096) {
    return false;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const supportedHost =
      EXACT_PUSH_SERVICE_HOSTS.has(hostname) ||
      hostname.endsWith(".notify.windows.com");

    return url.protocol === "https:" &&
      supportedHost &&
      url.username.length === 0 &&
      url.password.length === 0 &&
      url.port.length === 0 &&
      url.hash.length === 0 &&
      url.pathname.length > 1;
  } catch {
    return false;
  }
}

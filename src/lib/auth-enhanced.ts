/**
 * Authentication Utilities
 * URL helpers, open-redirect guards, and OAuth config status.
 * Production session management is handled entirely by supabase.auth.getUser()
 * via @supabase/ssr — no manual JWT decoding is needed.
 */

import { getServerEnv } from "@/lib/env";
import { PRODUCTION_URL } from "@/lib/site";

/**
 * Build OAuth redirect URI
 */
export function buildOAuthRedirectUri(
  baseUrl: string,
  nextPath?: string
): string {
  const url = new URL("/auth/callback", getCanonicalAuthBaseUrl(baseUrl));
  if (nextPath) {
    url.searchParams.set(
      "next",
      extractNextPath(new URLSearchParams({ next: nextPath }))
    );
  }
  return url.toString();
}

/**
 * Keep production auth on one registered, user-facing origin.
 *
 * Supabase OAuth uses the exact configured redirect URL. Vercel exposes several
 * aliases for the same deployment, but those aliases are not the public OAuth
 * origin for ZIKR. Localhost remains supported for development.
 */
export function getCanonicalAuthBaseUrl(baseUrl?: string | null): string {
  if (!baseUrl) return PRODUCTION_URL;

  try {
    const url = new URL(baseUrl);
    const host = url.hostname.toLowerCase();

    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return url.origin;
    }

    // OAuth redirect URIs must always point to this app, not to Supabase's
    // provider callback URL (https://<project>.supabase.co/auth/v1/callback).
    // If a Supabase/Auth URL or a Vercel deployment/branch URL is supplied,
    // fall back to the stable project production origin so auth cannot drift.
    if (
      host.endsWith(".supabase.co") ||
      url.pathname.startsWith("/auth/v1/") ||
      host.endsWith(".vercel.app")
    ) {
      return PRODUCTION_URL;
    }

    return PRODUCTION_URL;
  } catch {
    return PRODUCTION_URL;
  }
}

export function isPkceVerifierError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : '';

  return /invalid flow state|no valid flow state|(?:pkce|code verifier).*(?:not found|missing|expired)|verifier.*(?:not found|missing|expired)/i.test(
    message,
  );
}

export function getGoogleOAuthConfigStatus() {
  const env = getServerEnv();
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  const appCallbackUrl = buildOAuthRedirectUri(PRODUCTION_URL);
  const configuredCallbackUrl = env.AUTH_CALLBACK_URL || appCallbackUrl;
  return {
    isReady: missing.length === 0,
    missing,
    appCallbackUrl,
    configuredCallbackUrl,
  };
}

/**
 * Resolve the safe origin used by auth route handlers after callback.
 */
export function getTrustedAuthOrigin(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (host) {
    return getCanonicalAuthBaseUrl(`${forwardedProto}://${host}`);
  }

  return PRODUCTION_URL;
}

/**
 * Extract next redirect path from URL.
 * Validates against open-redirect: only same-origin relative paths are allowed.
 */
export function extractNextPath(searchParams: URLSearchParams): string {
  const next = searchParams.get("next");

  if (!next) return "/profile";

  if (!next.startsWith("/") || next.startsWith("//")) return "/profile";

  try {
    const url = new URL(next, "http://localhost");
    if (url.origin === "http://localhost" && url.pathname.startsWith("/")) {
      return url.pathname + url.search;
    }
  } catch {
    // Invalid URL, use default
  }

  return "/profile";
}

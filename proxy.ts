import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { PRODUCTION_URL } from "@/lib/site";

const PROTECTED_PREFIXES = ["/profile", "/favorites", "/admin", "/wird", "/memorization"];

const AUTH_ONLY_PATHS = ["/auth/login", "/auth/register"];
const AUTH_CALLBACK_PREFIX = "/auth/callback";

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(loginUrl);
}

function nextWithPathHeader(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-zikr-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vercel exposes multiple aliases for the same production deployment. Keep
  // the user-facing site and OAuth callback on the canonical public origin.
  if (process.env.VERCEL_ENV === "production") {
    const requestHost = request.nextUrl.hostname.toLowerCase();
    const canonicalHost = new URL(PRODUCTION_URL).hostname.toLowerCase();
    if (requestHost.endsWith(".vercel.app") && requestHost !== canonicalHost) {
      const canonicalUrl = new URL(request.url);
      canonicalUrl.protocol = "https:";
      canonicalUrl.host = canonicalHost;
      return NextResponse.redirect(canonicalUrl, 308);
    }
  }

  // Let the OAuth callback through without session checks
  if (
    pathname === AUTH_CALLBACK_PREFIX ||
    pathname.startsWith(`${AUTH_CALLBACK_PREFIX}/`)
  ) {
    return nextWithPathHeader(request);
  }

  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthOnlyPage = matchesPrefix(pathname, AUTH_ONLY_PATHS);

  // Build the mutable response ONCE — pass it to createMiddlewareClient so
  // any Set-Cookie headers Supabase writes are preserved on this response.
  const headers = new Headers(request.headers);
  headers.set("x-zikr-pathname", pathname);
  const response = NextResponse.next({ request: { headers } });
  const { supabase, configured } = createMiddlewareClient(request, response);

  if (!configured || !supabase) {
    return isProtected ? redirectToLogin(request) : response;
  }

  // getUser() validates the JWT and refreshes tokens when needed.
  // The refreshed session cookies are written onto `response` by the
  // cookie callbacks inside createMiddlewareClient.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Malformed or stale cookies must not turn every request into a 500.
    user = null;
  }

  if (!user && isProtected) {
    return redirectToLogin(request);
  }

  if (user && isAuthOnlyPage) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // Return the same `response` so Set-Cookie headers are forwarded
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.(?:json|webmanifest)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|css|js|map|woff2?)$).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let the OAuth callback through without session checks
  if (
    pathname === AUTH_CALLBACK_PREFIX ||
    pathname.startsWith(`${AUTH_CALLBACK_PREFIX}/`)
  ) {
    return NextResponse.next({ request });
  }

  const isProtected = matchesPrefix(pathname, PROTECTED_PREFIXES);
  const isAuthOnlyPage = matchesPrefix(pathname, AUTH_ONLY_PATHS);

  // Build the mutable response ONCE — pass it to createMiddlewareClient so
  // any Set-Cookie headers Supabase writes are preserved on this response.
  const response = NextResponse.next({ request });
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

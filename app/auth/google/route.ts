import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildOAuthRedirectUri, extractNextPath } from "@/lib/auth-enhanced";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const safePath = extractNextPath(request.nextUrl.searchParams);
  const redirectTo = buildOAuthRedirectUri(request.nextUrl.origin, safePath);
  const loginUrl = new URL("/auth/login", request.nextUrl.origin);
  loginUrl.searchParams.set("next", safePath);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // Supabase supplies the standard Google OpenID profile scopes. Passing
        // `email profile` again duplicates them in the authorization request.
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error || !data.url) {
      loginUrl.searchParams.set("error", "google_oauth_unavailable");
      const response = NextResponse.redirect(loginUrl);
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      return response;
    }

    const response = NextResponse.redirect(data.url);
    // OAuth redirects contain per-session state and must never be cached or
    // replayed by a CDN, browser history layer, or shared WebView cache.
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    return response;
  } catch (error) {
    console.error("[auth/google] OAuth start failed:", error);
    loginUrl.searchParams.set("error", "google_oauth_failed");
    return NextResponse.redirect(loginUrl);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildOAuthRedirectUri,
  extractNextPath,
  getCanonicalAuthBaseUrl,
} from "@/lib/auth-enhanced";

export const dynamic = "force-dynamic";

function buildNativeOAuthRedirectUri(nextPath: string, authOrigin: string): string {
  const url = new URL("/auth/callback", authOrigin);
  url.searchParams.set("native", "1");
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export async function handleGoogleOAuth(request: NextRequest) {
  const safePath = extractNextPath(request.nextUrl.searchParams);
  const native = request.nextUrl.searchParams.get("native") === "1";
  const authOrigin = getCanonicalAuthBaseUrl(request.nextUrl.origin);
  // The PKCE verifier is written to the response origin. Redirect every
  // non-canonical production origin before creating it; restricting this to
  // Vercel aliases would leave custom-domain callbacks without the verifier.
  const canonicalOrigin = new URL(authOrigin);
  if (request.nextUrl.origin !== canonicalOrigin.origin) {
    const canonicalStart = new URL(request.url);
    canonicalStart.protocol = canonicalOrigin.protocol;
    canonicalStart.host = canonicalOrigin.host;
    const response = NextResponse.redirect(canonicalStart, 307);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
  const redirectTo = native
    ? buildNativeOAuthRedirectUri(safePath, authOrigin)
    : buildOAuthRedirectUri(authOrigin, safePath);
  const loginUrl = new URL("/auth/login", authOrigin);
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
      if (native) {
        return NextResponse.json(
          { error: "google_oauth_unavailable" },
          {
            status: 503,
            headers: { "Cache-Control": "private, no-store, max-age=0" },
          }
        );
      }
      loginUrl.searchParams.set("error", "google_oauth_unavailable");
      const response = NextResponse.redirect(loginUrl);
      response.headers.set("Cache-Control", "private, no-store, max-age=0");
      return response;
    }

    if (native) {
      return NextResponse.json(
        { url: data.url },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } }
      );
    }

    const response = NextResponse.redirect(data.url);
    // OAuth redirects contain per-session state and must never be cached or
    // replayed by a CDN, browser history layer, or shared WebView cache.
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("[auth/google] OAuth start failed:", error);
    if (native) {
      return NextResponse.json(
        { error: "google_oauth_failed" },
        {
          status: 503,
          headers: { "Cache-Control": "private, no-store, max-age=0" },
        }
      );
    }
    loginUrl.searchParams.set("error", "google_oauth_failed");
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}

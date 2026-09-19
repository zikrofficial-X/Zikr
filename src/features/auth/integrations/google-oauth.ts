import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildOAuthRedirectUri, extractNextPath } from "@/lib/auth-enhanced";

export const dynamic = "force-dynamic";

function buildNativeOAuthRedirectUri(nextPath: string): string {
  const url = new URL("com.zikr.app://auth/callback");
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export async function handleGoogleOAuth(request: NextRequest) {
  const safePath = extractNextPath(request.nextUrl.searchParams);
  const native = request.nextUrl.searchParams.get("native") === "1";
  const redirectTo = native
    ? buildNativeOAuthRedirectUri(safePath)
    : buildOAuthRedirectUri(request.nextUrl.origin, safePath);
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

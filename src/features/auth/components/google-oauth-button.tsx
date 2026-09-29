"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Button } from "@/components/ui/button";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { PRODUCTION_URL } from "@/lib/site";

type GoogleOAuthButtonProps = {
  next?: string;
  label: string;
};

function getSafeNextPath(next?: string): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/profile";
}

function getCanonicalBrowserOrigin(): string {
  // The browser bundle may contain a stale or alias-valued public env var.
  // Keep production Google OAuth pinned to the canonical public origin while
  // preserving localhost for local development.
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return window.location.origin;
    }
  }
  return PRODUCTION_URL;
}

function buildNativeOAuthRedirect(nextPath: string): string {
  // Start with the canonical HTTPS application callback. Supabase/Google can
  // reliably validate this URI, and the callback route hands the code back to
  // the app deep link after Google completes authentication.
  const url = new URL("/auth/callback", getCanonicalBrowserOrigin());
  url.searchParams.set("native", "1");
  url.searchParams.set("next", nextPath);
  return url.toString();
}

export function GoogleOAuthButton({ next, label }: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleBrowserFinished = () => setLoading(false);
    const handleNativeResumed = () => setLoading(false);

    window.addEventListener("zikr:native-browser-finished", handleBrowserFinished);
    window.addEventListener("zikr:native-resumed", handleNativeResumed);

    return () => {
      window.removeEventListener("zikr:native-browser-finished", handleBrowserFinished);
      window.removeEventListener("zikr:native-resumed", handleNativeResumed);
    };
  }, []);

  const onClick = async () => {
    setLoading(true);
    setError(null);
    const safeNext = getSafeNextPath(next);

    try {
      const isNative = Capacitor.isNativePlatform();

      // PKCE verifier cookies are scoped to the current browser origin. If a
      // user opened a Vercel alias, move them to the canonical origin before
      // creating the verifier; otherwise Google returns to the canonical host
      // while the verifier remains stranded on the alias.
      if (!isNative && typeof window !== "undefined") {
        const canonicalOrigin = new URL(PRODUCTION_URL).origin;
        const currentOrigin = new URL(window.location.origin).origin;
        if (currentOrigin !== canonicalOrigin) {
          const canonicalLogin = new URL("/auth/login", canonicalOrigin);
          canonicalLogin.searchParams.set("next", safeNext);
          window.location.assign(canonicalLogin.toString());
          return;
        }
      }

      const supabase = createBrowserSupabaseClient();

      // Native OAuth starts at the canonical HTTPS app callback. The callback
      // route then hands the authorization code back to the app deep link,
      // while the PKCE verifier remains in this WebView's Supabase client.
      const redirectTo = isNative
        ? buildNativeOAuthRedirect(safeNext)
        : new URL(
            `/auth/callback?next=${encodeURIComponent(safeNext)}`,
            getCanonicalBrowserOrigin(),
          ).toString();

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (oauthError) throw oauthError;
      if (!data.url) {
        throw new Error("Google OAuth authorization URL was not returned.");
      }

      if (isNative) {
        await Browser.open({ url: data.url });
      } else {
        window.location.assign(data.url);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "تعذر تسجيل الدخول عبر Google. حاول مرة أخرى.";

      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "جارٍ التوجيه إلى Google..." : label}
      </Button>

      {error && (
        <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">{error}</p>
          <p className="text-xs text-red-400">
            تأكد من إعداد Google OAuth في Supabase ثم حاول مرة أخرى.
          </p>
        </div>
      )}
    </div>
  );
}

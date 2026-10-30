"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { SocialLogin } from "@capgo/capacitor-social-login";
import { Button } from "@/components/ui/button";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import { PRODUCTION_URL, isV0PreviewHost } from "@/lib/site";

type GoogleOAuthButtonProps = {
  next?: string;
  label: string;
};

let nativeGoogleInitialization: Promise<void> | null = null;

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
  // Retained for iOS' existing browser-based OAuth path. Android now signs in
  // natively through Credential Manager and Supabase signInWithIdToken.
  const url = new URL("/auth/callback", getCanonicalBrowserOrigin());
  url.searchParams.set("native", "1");
  url.searchParams.set("next", nextPath);
  return url.toString();
}

async function signInWithNativeGoogle(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
): Promise<void> {
  const webClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) {
    throw new Error(
      "إعداد Google Web Client ID غير موجود. راجع NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID في إعدادات Vercel.",
    );
  }

  if (!nativeGoogleInitialization) {
    nativeGoogleInitialization = SocialLogin.initialize({
      google: {
        webClientId,
        mode: "online",
      },
    }).catch((error: unknown) => {
      nativeGoogleInitialization = null;
      throw error;
    });
  }
  await nativeGoogleInitialization;

  // Google receives the SHA-256 nonce; Supabase receives the original nonce
  // and verifies that it matches the nonce embedded in Google's ID token.
  const response = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
      style: "bottom",
      filterByAuthorizedAccounts: false,
    },
  });

  if (response.result.responseType !== "online" || !response.result.idToken) {
    throw new Error("لم يُرجع Google رمز هوية صالحًا لتسجيل الدخول.");
  }

  const { idToken, accessToken } = response.result;
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    ...(accessToken?.token ? { access_token: accessToken.token } : {}),
  });

  if (error) throw error;

  // Keep the existing server-side profile synchronization behavior after
  // the Supabase session has been established in the WebView.
  try {
    await fetch("/api/auth/profile-sync", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Profile sync is best-effort; authentication is already successful.
  }
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
      const isAndroidNative = Capacitor.getPlatform() === "android";

      // Browser PKCE verifier cookies are scoped to the current browser origin.
      // Keep web/preview OAuth on the same origin as its verifier; Android uses
      // the native ID-token flow above and does not create a browser PKCE verifier.
      const previewRedirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;
      const usePreviewRedirect =
        !isNative &&
        typeof window !== "undefined" &&
        !!previewRedirect &&
        isV0PreviewHost(window.location.hostname);

      if (!isNative && !usePreviewRedirect && typeof window !== "undefined") {
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

      // Android uses Google's native Credential Manager. No Chrome,
      // Custom Tab, browser redirect, or PKCE callback is involved.
      if (isAndroidNative) {
        await signInWithNativeGoogle(supabase);
        window.location.replace(safeNext);
        return;
      }

      // Keep the existing web OAuth flow unchanged. iOS continues to use its
      // existing browser-based flow until a separate iOS client is configured.
      const redirectTo = isNative
        ? buildNativeOAuthRedirect(safeNext)
        : usePreviewRedirect && previewRedirect
          ? previewRedirect
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
        {loading ? "جارٍ تسجيل الدخول عبر Google..." : label}
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

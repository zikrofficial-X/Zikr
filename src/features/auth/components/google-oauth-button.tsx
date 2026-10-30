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
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return window.location.origin;
    }
  }
  return PRODUCTION_URL;
}

function buildNativeOAuthRedirect(nextPath: string): string {
  // Browser fallback returns the PKCE callback to the installed app through
  // NativeGoogleOAuthHandler. This also supports older APKs without SocialLogin.
  const url = new URL("/auth/callback", getCanonicalBrowserOrigin());
  url.searchParams.set("native", "1");
  url.searchParams.set("next", nextPath);
  return url.toString();
}

function getNativeGoogleErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const normalized = raw.toLowerCase();
  if (
    normalized.includes("activity is cancelled") ||
    normalized.includes("activity is canceled") ||
    normalized.includes("user_cancelled") ||
    normalized.includes("user canceled") ||
    normalized.includes("28444") ||
    normalized.includes("developer console")
  ) {
    return "تعذر إكمال تسجيل Google الأصلي. غالبًا إعداد Android OAuth غير مطابق: راجع اسم الحزمة com.zikr.app وبصمة SHA-1 للنسخة المثبتة، وتأكد أن Web Client ID وAndroid OAuth Client من مشروع Google نفسه.";
  }
  return raw
    ? `تعذر تسجيل الدخول عبر Google الأصلي: ${raw}`
    : "تعذر تسجيل الدخول عبر Google الأصلي. يمكنك المتابعة باستخدام المتصفح الآمن.";
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

  try {
    await fetch("/api/auth/profile-sync", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // Authentication is already successful; profile synchronization is best-effort.
  }
}

async function startBrowserGoogleOAuth(
  supabase: ReturnType<typeof createBrowserSupabaseClient>,
  safeNext: string,
  isNative: boolean,
  usePreviewRedirect: boolean,
  previewRedirect?: string,
): Promise<void> {
  const redirectTo = isNative
    ? buildNativeOAuthRedirect(safeNext)
    : usePreviewRedirect && previewRedirect
      ? previewRedirect
      : new URL(
          `/auth/callback?next=${encodeURIComponent(safeNext)}`,
          getCanonicalBrowserOrigin(),
        ).toString();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (!data.url) {
    throw new Error("Google OAuth authorization URL was not returned.");
  }

  if (isNative) {
    await Browser.open({ url: data.url });
  } else {
    window.location.assign(data.url);
  }
}

export function GoogleOAuthButton({ next, label }: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browserFallbackAvailable, setBrowserFallbackAvailable] = useState(false);

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
    setBrowserFallbackAvailable(false);
    const safeNext = getSafeNextPath(next);

    try {
      const isNative = Capacitor.isNativePlatform();
      const isAndroidNative = isNative && Capacitor.getPlatform() === "android";

      // Browser PKCE verifier cookies are scoped to the current origin. Web and
      // preview sign-in must keep the verifier on the same host as its callback.
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

      // Only call Credential Manager when the installed native binary actually
      // contains the plugin. Capacitor apps load this page from the live server,
      // so an older APK can otherwise run newer JS against a missing native plugin.
      if (isAndroidNative && Capacitor.isPluginAvailable("SocialLogin")) {
        try {
          await signInWithNativeGoogle(supabase);
          window.location.replace(safeNext);
          return;
        } catch (nativeError) {
          setError(getNativeGoogleErrorMessage(nativeError));
          setBrowserFallbackAvailable(true);
          setLoading(false);
          return;
        }
      }

      // Compatibility path for older Android APKs (without SocialLogin) and
      // iOS: use the HTTPS PKCE bridge, then return to the app's deep link.
      await startBrowserGoogleOAuth(
        supabase,
        safeNext,
        isNative,
        usePreviewRedirect,
        previewRedirect,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "تعذر تسجيل الدخول عبر Google. حاول مرة أخرى.";

      setError(message);
      setLoading(false);
    }
  };

  const onContinueWithBrowser = async () => {
    setLoading(true);
    setError(null);
    setBrowserFallbackAvailable(false);
    try {
      await startBrowserGoogleOAuth(
        createBrowserSupabaseClient(),
        getSafeNextPath(next),
        true,
        false,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر فتح تسجيل الدخول عبر المتصفح. حاول مرة أخرى.",
      );
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
          {browserFallbackAvailable ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onContinueWithBrowser}
              disabled={loading}
            >
              المتابعة عبر المتصفح الآمن
            </Button>
          ) : (
            <p className="text-xs text-red-400">
              تعذر تسجيل الدخول عبر Google. تأكد من إعداد مزود Google في Supabase ثم حاول مرة أخرى.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

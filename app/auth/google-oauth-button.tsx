"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

type GoogleOAuthButtonProps = {
  next?: string;
  label: string;
};

type NativeAuthWindow = Window & {
  zikrNative?: {
    isNative?: boolean;
    startGoogleOAuth?: (nextPath?: string) => Promise<void>;
  };
};

function getSafeNextPath(next?: string): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/profile";
}

export function GoogleOAuthButton({ next, label }: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleNativeBrowserFinished = () => setLoading(false);
    const handleNativeResumed = () => setLoading(false);

    window.addEventListener(
      "zikr:native-browser-finished",
      handleNativeBrowserFinished
    );
    window.addEventListener("zikr:native-resumed", handleNativeResumed);
    return () => {
      window.removeEventListener(
        "zikr:native-browser-finished",
        handleNativeBrowserFinished
      );
      window.removeEventListener("zikr:native-resumed", handleNativeResumed);
    };
  }, []);

  const onClick = async () => {
    setLoading(true);
    setError(null);
    const safeNext = getSafeNextPath(next);
    const native = (window as NativeAuthWindow).zikrNative;

    try {
      if (native?.isNative && native.startGoogleOAuth) {
        // Google blocks embedded WebViews on many Android builds. The native
        // bridge first obtains the OAuth URL in this WebView (preserving the
        // Supabase PKCE cookie), then opens it in the system Custom Tab.
        await native.startGoogleOAuth(safeNext);
        return;
      }

      // Web: start OAuth directly from the browser Supabase client. This keeps
      // the PKCE verifier in the same browser that will receive /auth/callback
      // and avoids depending on a server-only OAuth bootstrap route just to
      // create the initial authorization URL.
      const supabase = createBrowserSupabaseClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", safeNext);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (oauthError) throw oauthError;
      if (!data.url) throw new Error("Google OAuth authorization URL was not returned.");

      // signInWithOAuth normally navigates for a browser client, but keep an
      // explicit navigation as a fallback for environments where it returns
      // the URL without changing location.
      if (window.location.href === window.location.href) {
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

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
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to the compile-time production fallback.
    }
  }
  return PRODUCTION_URL;
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
      const supabase = createBrowserSupabaseClient();
      const isNative = Capacitor.isNativePlatform();

      // Native OAuth returns directly to the app's registered deep link.
      // This removes the previous HTTPS callback -> deep-link bridge hop,
      // which could leave the external Custom Tab open or break the native
      // PKCE flow on some Android/browser combinations.
      const redirectTo = isNative
        ? new URL("com.zikr.app://auth/callback")
        : new URL(
            `/auth/callback?next=${encodeURIComponent(safeNext)}`,
            getCanonicalBrowserOrigin(),
          );

      if (isNative) redirectTo.searchParams.set("next", safeNext);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
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

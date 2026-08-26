"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

export function GoogleOAuthButton({ next, label }: GoogleOAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleBrowserFinished = () => {
      // If the user backs out of the system Custom Tab without completing
      // OAuth, make the button usable again instead of leaving it disabled.
      setLoading(false);
    };

    window.addEventListener(
      "zikr:native-browser-finished",
      handleBrowserFinished
    );
    return () =>
      window.removeEventListener(
        "zikr:native-browser-finished",
        handleBrowserFinished
      );
  }, []);

  const onClick = async () => {
    setLoading(true);
    setError(null);

    try {
      const safeNext =
        typeof next === "string" && next.startsWith("/") ? next : "/profile";

      const native = (window as NativeAuthWindow).zikrNative;
      if (native?.isNative && native.startGoogleOAuth) {
        // Google blocks embedded WebViews on many Android builds. The native
        // bridge first obtains the OAuth URL in this WebView (preserving the
        // Supabase PKCE cookie), then opens it in the system Custom Tab.
        await native.startGoogleOAuth(safeNext);
        return;
      }

      // Use a full browser navigation for the normal web flow. Client-side
      // router navigation can treat the redirect as an RSC request and is less
      // reliable for preserving the browser cookie with the PKCE verifier.
      const oauthUrl = new URL("/auth/google", window.location.origin);
      oauthUrl.searchParams.set("next", safeNext);
      window.location.assign(oauthUrl.toString());
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
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">{error}</p>

          <p className="mt-1 text-xs text-red-400">
            تأكد من تفعيل Google OAuth في إعدادات Supabase
          </p>
        </div>
      )}
    </div>
  );
}

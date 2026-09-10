"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

function getSafeNextPath(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

function isNativeGoogleCallback(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return (
      url.protocol === "com.zikr.app:" &&
      url.hostname === "auth" &&
      url.pathname.startsWith("/callback")
    );
  } catch {
    return false;
  }
}

function loginUrl(error: string, nextPath: string): string {
  const params = new URLSearchParams({ error, next: nextPath });
  return `/auth/login?${params.toString()}`;
}

async function closeExternalBrowser() {
  try {
    await Browser.close();
  } catch {
    // Android can already have closed the custom tab while handing control
    // back to the app. Closing is therefore deliberately best-effort.
  }
  window.dispatchEvent(new CustomEvent("zikr:native-browser-finished"));
  window.dispatchEvent(new CustomEvent("zikr:native-resumed"));
}

export function NativeGoogleOAuthHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const supabase = createBrowserSupabaseClient();
    const handledCallbacks = new Set<string>();
    let urlListener: { remove: () => Promise<void> } | undefined;
    let stateListener: { remove: () => Promise<void> } | undefined;

    const handleCallback = async (rawUrl: string) => {
      if (!rawUrl || !isNativeGoogleCallback(rawUrl) || handledCallbacks.has(rawUrl)) {
        return;
      }
      handledCallbacks.add(rawUrl);

      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return;
      }

      const nextPath = getSafeNextPath(parsed.searchParams.get("next"));
      const flowId = parsed.searchParams.get("sb_flow_id")?.trim() || null;
      const oauthError = parsed.searchParams.get("error");
      const oauthErrorDescription = parsed.searchParams.get("error_description");
      const code = parsed.searchParams.get("code");

      if (oauthError || !code) {
        await closeExternalBrowser();
        window.location.replace(
          loginUrl(
            oauthError ? "google_oauth_failed" : "auth_session_missing",
            nextPath,
          ),
        );
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(
          code,
          flowId ? { flowId } : undefined,
        );
        if (error) {
          const normalized = error.message.toLowerCase();
          const errorCode =
            normalized.includes("pkce") ||
            normalized.includes("verifier") ||
            normalized.includes("code verifier") ||
            normalized.includes("flow")
              ? "auth_pkce_expired"
              : "auth_callback_failed";

          await closeExternalBrowser();
          window.location.replace(loginUrl(errorCode, nextPath));
          return;
        }

        try {
          await fetch("/api/auth/profile-sync", {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          });
        } catch {
          // Profile sync is best-effort; the Supabase session is already valid.
        }

        await closeExternalBrowser();
        window.location.replace(nextPath);
      } catch (error) {
        console.error("[native-google-oauth] callback exchange failed", error);
        await closeExternalBrowser();
        window.location.replace(
          loginUrl(
            oauthErrorDescription ? "google_oauth_failed" : "auth_callback_failed",
            nextPath,
          ),
        );
      }
    };

    const subscribe = async () => {
      // Register the listener before checking launchUrl so a deep link delivered
      // during startup cannot race the initial callback lookup.
      urlListener = await App.addListener("appUrlOpen", ({ url }) => {
        void handleCallback(url);
      });

      stateListener = await App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive) return;
        void App.getLaunchUrl().then((launch) => {
          if (launch?.url) void handleCallback(launch.url);
        });
      });

      const launch = await App.getLaunchUrl();
      if (launch?.url) void handleCallback(launch.url);
    };

    void subscribe();

    return () => {
      void urlListener?.remove();
      void stateListener?.remove();
    };
  }, []);

  return null;
}

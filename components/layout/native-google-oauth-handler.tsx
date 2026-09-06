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
  const params = new URLSearchParams({
    error,
    next: nextPath,
  });
  return `/auth/login?${params.toString()}`;
}

async function closeExternalBrowser() {
  try {
    await Browser.close();
  } catch {
    // Browser may already be closed after the custom-scheme handoff.
  }
  window.dispatchEvent(new CustomEvent("zikr:native-browser-finished"));
}

export function NativeGoogleOAuthHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const supabase = createBrowserSupabaseClient();
    let handled = false;
    let listener: { remove: () => Promise<void> } | undefined;

    const handleCallback = async (rawUrl: string) => {
      if (!rawUrl || handled || !isNativeGoogleCallback(rawUrl)) return;
      handled = true;

      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return;
      }

      const nextPath = getSafeNextPath(parsed.searchParams.get("next"));
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
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          const normalized = error.message.toLowerCase();
          const errorCode =
            normalized.includes("pkce") ||
            normalized.includes("verifier") ||
            normalized.includes("code verifier")
              ? "auth_pkce_expired"
              : "auth_callback_failed";

          await closeExternalBrowser();
          window.location.replace(loginUrl(errorCode, nextPath));
          return;
        }

        // Keep the profile bootstrap behavior from the server callback, but do
        // it after the native client has established the session and cookies.
        try {
          await fetch("/api/auth/profile-sync", {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          });
        } catch {
          // Profile sync is best-effort; authentication itself is already valid.
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

    void App.addListener("appUrlOpen", ({ url }) => {
      void handleCallback(url);
    }).then((handle) => {
      listener = handle;
    });

    // Android may deliver the OAuth custom scheme during a cold start rather
    // than through appUrlOpen, so always inspect the launch URL as well.
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void handleCallback(launch.url);
    });

    return () => {
      void listener?.remove();
    };
  }, []);

  return null;
}

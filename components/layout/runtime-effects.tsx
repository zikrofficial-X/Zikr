"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdSense } from "./adsense";
import { AppUpdateChecker } from "./app-update-checker";
import { GoogleFundingChoices } from "./google-funding-choices";
import { PrayerAlertProvider } from "./prayer-alert-provider";
import { ServiceWorkerRegister } from "./service-worker-register";

const NON_AD_PATHS = [
  "/search",
  "/qibla",
  "/prayer-times",
  "/tasbeeh",
  "/memorization",
  "/wird",
  "/zakat",
  "/offline-library",
  "/settings",
  "/favorites",
  "/profile",
  "/spiritual-ai",
  "/competitions",
  "/radio",
  "/youtube",
  "/videos",
  "/reciters",
  "/tawasheeh",
  "/kids/puzzle",
  "/admin",
  "/api",
  "/auth",
  "/privacy",
  "/terms",
  "/about",
  "/contact",
  "/editorial-policy",
  "/faq",
  "/platform",
] as const;

function adsAllowedOnPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return !NON_AD_PATHS.some(
    blocked => pathname === blocked || pathname.startsWith(`${blocked}/`),
  );
}

function DeferredThirdPartyRuntime() {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;

  const adsAllowed = adsAllowedOnPath(pathname);

  return (
    <>
      {process.env.NODE_ENV === "production" && adsAllowed && (
        <>
          <GoogleFundingChoices />
          <AdSense />
        </>
      )}
    </>
  );
}

export function RuntimeEffects() {
  return (
    <>
      <ServiceWorkerRegister />
      <AppUpdateChecker />
      <PrayerAlertProvider />
      <DeferredThirdPartyRuntime />
    </>
  );
}

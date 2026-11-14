"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { PRODUCTION_URL } from "@/lib/site";
import { AdSense, ADSENSE_CONFIGURED } from "./adsense";
import { AppUpdateChecker } from "./app-update-checker";
import { PrayerAlertProvider } from "./prayer-alert-provider";
import { ServiceWorkerRegister } from "./service-worker-register";

function adsAllowedOnPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const normalizedPath = pathname.replace(/\/+$/, "");
  return (
    normalizedPath.startsWith("/articles/") &&
    normalizedPath.length > "/articles/".length
  );
}

function DeferredThirdPartyRuntime() {
  const [ready, setReady] = useState(false);
  const [isWebRuntime, setIsWebRuntime] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isCanonicalOrigin = false;
    try {
      isCanonicalOrigin = window.location.origin === new URL(PRODUCTION_URL).origin;
    } catch {
      isCanonicalOrigin = false;
    }
    setIsWebRuntime(!Capacitor.isNativePlatform() && isCanonicalOrigin);
  }, []);

  if (!ready) return null;

  const adsAllowed =
    isWebRuntime && ADSENSE_CONFIGURED && adsAllowedOnPath(pathname);

  return <>{adsAllowed && <AdSense />}</>;
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

"use client";

import { useEffect, useState } from "react";
import { AdSense } from "./adsense";
import { AppUpdateChecker } from "./app-update-checker";
import { Analytics } from "./analytics";
import { GoogleFundingChoices } from "./google-funding-choices";
import { PrayerAlertProvider } from "./prayer-alert-provider";
import { ServiceWorkerRegister } from "./service-worker-register";
import { SpeedInsights } from "@vercel/speed-insights/next";

function DeferredThirdPartyRuntime() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {process.env.NODE_ENV === "production" && (
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

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Capacitor } from "@capacitor/core";
import { PRODUCTION_URL } from "@/lib/site";

const MONETAG_VERIFICATION = "8dc00be3e026b336f3aa64f60373941e";
const MONETAG_PRIMARY_ZONE = "12171820";
const MONETAG_SECONDARY_ZONE = "12171818";
const GOOGLE_TAG_MANAGER_ID =
  process.env.NEXT_PUBLIC_GTM_ID || "GTM-PVQCFKCB";
const GOOGLE_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-W30Z9JW0VF";
const GOOGLE_ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2457467624248791";

function appendScript(id: string, src: string, options?: { cfasync?: boolean }) {
  if (document.getElementById(id)) return;

  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  if (options?.cfasync === false) script.dataset.cfasync = "false";
  document.head.appendChild(script);
}

function isCanonicalProductionOrigin(): boolean {
  try {
    return window.location.origin === new URL(PRODUCTION_URL).origin;
  } catch {
    return false;
  }
}

function removeAdvertisingElements() {
  const selectors = [
    'meta[name="monetag"]',
    'meta[name="google-adsense-account"]',
    'script[src*="al5sm.com"]',
    'script[src*="5gvci.com"]',
    'script[src*="fundingchoicesmessages.google.com"]',
    'script[src*="googletagmanager.com/gtm.js"]',
    'script[src*="googletagmanager.com/gtag/js"]',
    'script#google-analytics-config',
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    'iframe[src*="5gvci.com"]',
    'iframe[src*="al5sm.com"]',
    'iframe[src*="googleads.g.doubleclick.net"]',
    'iframe[src*="tpc.googlesyndication.com"]',
    'a[href^="https://uplcm.com/4/12171895"]',
  ];

  document.querySelectorAll(selectors.join(",")).forEach(element => {
    element.remove();
  });

  const windowWithAds = window as Window & { adsbygoogle?: unknown[] };
  delete windowWithAds.adsbygoogle;
}

/**
 * Advertising and Google Analytics integrations are website-only. Native
 * Capacitor shells and non-canonical deployment aliases must not load tags.
 */
export function WebAdvertisingRuntime() {
  const [canonicalWebRuntime, setCanonicalWebRuntime] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      removeAdvertisingElements();
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      removeAdvertisingElements();
      return;
    }

    // Vercel Preview deployments are production builds too. Never inject
    // publisher scripts outside the canonical origin.
    if (!isCanonicalProductionOrigin()) {
      removeAdvertisingElements();
      return;
    }

    setCanonicalWebRuntime(true);

    const monetagMeta = document.querySelector('meta[name="monetag"]');
    if (!monetagMeta) {
      const meta = document.createElement("meta");
      meta.name = "monetag";
      meta.content = MONETAG_VERIFICATION;
      document.head.appendChild(meta);
    }

    const adsenseMeta = document.querySelector(
      'meta[name="google-adsense-account"]',
    );
    if (!adsenseMeta) {
      const meta = document.createElement("meta");
      meta.name = "google-adsense-account";
      meta.content = GOOGLE_ADSENSE_CLIENT;
      document.head.appendChild(meta);
    }

    if (!document.getElementById("zikr-monetag-primary")) {
      const primary = document.createElement("script");
      primary.id = "zikr-monetag-primary";
      primary.dataset.zone = MONETAG_PRIMARY_ZONE;
      primary.src = "https://al5sm.com/tag.min.js";
      primary.async = true;
      document.head.appendChild(primary);
    }

    appendScript(
      "zikr-monetag-secondary",
      `https://5gvci.com/act/files/tag.min.js?z=${MONETAG_SECONDARY_ZONE}`,
      { cfasync: false },
    );

    appendScript(
      "google-funding-choices",
      "https://fundingchoicesmessages.google.com/i/fundingchoicesmessages.js",
    );

    if (/^GTM-[A-Z0-9]+$/i.test(GOOGLE_TAG_MANAGER_ID)) {
      const windowWithDataLayer = window as Window & {
        dataLayer?: Array<Record<string, unknown>>;
      };
      windowWithDataLayer.dataLayer = windowWithDataLayer.dataLayer ?? [];
      windowWithDataLayer.dataLayer.push({
        "gtm.start": Date.now(),
        event: "gtm.js",
      });
      appendScript(
        "google-tag-manager",
        `https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_MANAGER_ID}`,
      );
    }
  }, []);

  const validAnalyticsId = /^G-[A-Z0-9]+$/i.test(GOOGLE_ANALYTICS_ID);

  return (
    <>
      {canonicalWebRuntime && validAnalyticsId && (
        <>
          <Script
            id="google-analytics-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics-config" strategy="lazyOnload">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}', { send_page_view: true });`}
          </Script>
        </>
      )}
    </>
  );
}

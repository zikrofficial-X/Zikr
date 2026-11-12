import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getServiceWorkerScriptUrl } from "../../src/lib/ads/runtime-policy";
import { PRODUCTION_URL } from "../../src/lib/site";

const productionOrigin = new URL(PRODUCTION_URL).origin;

assert.equal(productionOrigin, "https://zikrmediaofficial.vercel.app");
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: true,
    origin: productionOrigin,
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js?native=1",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    origin: productionOrigin,
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js?monetag=1",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    origin: "https://zikr-git-preview.vercel.app",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    origin: "https://zikrmediaofficial.vercel.app.evil",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    origin: "http://localhost:3000",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
);

assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    origin: "https://zikrmediaofficial.vercel.app:8443",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
  "a non-default port on the canonical hostname is not the canonical production origin",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    origin: "http://zikrmediaofficial.vercel.app",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
  "an HTTP origin must not receive the Monetag-enabled worker",
);

const worker = readFileSync("public/sw.js", "utf8");
assert.ok(worker.includes('searchParams.get("native") === "1"'));
assert.ok(worker.includes('searchParams.get("monetag") === "1"'));
assert.ok(
  worker.includes('serviceWorkerLocation.origin === "https://zikrmediaofficial.vercel.app"'),
  "the worker must enforce the exact canonical HTTPS origin, including its port",
);
assert.ok(
  !worker.includes('serviceWorkerLocation.hostname.toLowerCase() === "zikrmediaofficial.vercel.app"'),
  "hostname-only checks must not re-enable advertising on alternate origins",
);
const guardIndex = worker.indexOf("if (isCanonicalMonetagWorker)");
const importIndex = worker.indexOf(
  "importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')",
);
const importTryIndex = worker.lastIndexOf("try {", importIndex);
const importCatchIndex = worker.indexOf("} catch", importIndex);
assert.ok(guardIndex >= 0 && guardIndex < importIndex);
assert.ok(importTryIndex >= 0 && importTryIndex < importIndex);
assert.ok(importCatchIndex > importIndex);
assert.ok(worker.includes("if (isCanonicalMonetagWorker) return;"));
assert.ok(worker.includes("await purgeDisabledAdvertisingMarkup()"));

const register = readFileSync("src/components/layout/service-worker-register.tsx", "utf8");
assert.match(
  register,
  /registration\.update\(\)\.catch\(/,
  "periodic service-worker update failures must be handled rather than becoming unhandled rejections",
);
const webAdsRuntime = readFileSync("src/components/layout/web-advertising-runtime.tsx", "utf8");
const adsenseSlot = readFileSync("src/components/layout/adsense-slot.tsx", "utf8");
const searchConsoleVerifier = readFileSync("scripts/verify-google-search-console.mjs", "utf8");
const consentModeVerifier = readFileSync("scripts/verify-consent-mode.mjs", "utf8");
assert.ok(
  consentModeVerifier.includes("if (!isCanonicalProductionOrigin())"),
  "Consent Mode verification must require the exact canonical origin before analytics injection",
);
assert.ok(
  !consentModeVerifier.includes("isCanonicalProductionHost"),
  "Consent Mode verification must not regress to hostname-only production checks",
);
assert.ok(
  searchConsoleVerifier.includes("if (!isCanonicalProductionOrigin())"),
  "Search Console verification must enforce the exact canonical origin before publisher-script injection",
);
assert.ok(
  !searchConsoleVerifier.includes("isCanonicalProductionHost"),
  "Search Console verification must not regress to hostname-only advertising checks",
);
const runtimeEffects = readFileSync("src/components/layout/runtime-effects.tsx", "utf8");
assert.ok(
  runtimeEffects.includes("window.location.origin === new URL(PRODUCTION_URL).origin"),
  "deferred AdSense scripts must require the exact canonical HTTPS origin, including its port",
);
assert.ok(
  !runtimeEffects.includes("window.location.hostname"),
  "deferred AdSense scripts must not use a hostname-only production gate",
);
const integrityVerifier = readFileSync("scripts/verify-project-integrity.mjs", "utf8");
assert.ok(
  integrityVerifier.includes("'window.location.origin'"),
  "project integrity must verify the origin-aware service-worker registration",
);
assert.ok(
  integrityVerifier.includes("'serviceWorkerLocation.origin === \"https://zikrmediaofficial.vercel.app\"'"),
  "project integrity must verify the exact canonical service-worker origin",
);
assert.ok(
  !integrityVerifier.includes("'window.location.hostname'") &&
    !integrityVerifier.includes("'hostname.toLowerCase() === \"zikrmediaofficial.vercel.app\"'"),
  "project integrity must not regress to hostname-only advertising gates",
);

assert.ok(webAdsRuntime.includes("window.location.origin === new URL(PRODUCTION_URL).origin"));
assert.ok(adsenseSlot.includes("window.location.origin === new URL(PRODUCTION_URL).origin"));


const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
assert.ok(
  !rootLayout.includes('name="google-adsense-account"') &&
    !rootLayout.includes("google-consent-mode-default") &&
    !rootLayout.includes("window.adsbygoogle") &&
    !rootLayout.includes("requestNonPersonalizedAds = 1"),
  "the server-rendered root layout must not emit AdSense publisher metadata or Consent Mode globals into native HTML",
);
const nativeGuardIndex = webAdsRuntime.indexOf("if (Capacitor.isNativePlatform())");
const canonicalGuardIndex = webAdsRuntime.indexOf("if (!isCanonicalProductionOrigin())");
const consentDefaultIndex = webAdsRuntime.indexOf("installConsentModeDefaults();");
const monetagInjectionIndex = webAdsRuntime.indexOf("document.head.appendChild(primary)");
const fundingChoicesIndex = webAdsRuntime.indexOf('"google-funding-choices"');
const tagManagerIndex = webAdsRuntime.indexOf('"google-tag-manager"');
assert.ok(
  nativeGuardIndex >= 0 &&
    canonicalGuardIndex > nativeGuardIndex &&
    consentDefaultIndex > canonicalGuardIndex &&
    consentDefaultIndex < monetagInjectionIndex &&
    consentDefaultIndex < fundingChoicesIndex &&
    consentDefaultIndex < tagManagerIndex,
  "Consent Mode defaults must be installed only after native and canonical-origin guards, before any web ad/analytics tags",
);
for (const token of [
  "ad_storage: 'denied'",
  "analytics_storage: 'denied'",
  "ad_user_data: 'denied'",
  "ad_personalization: 'denied'",
  "personalization_storage: 'denied'",
  "ads_data_redaction",
  "requestNonPersonalizedAds = 1",
]) {
  assert.ok(webAdsRuntime.includes(token), "web-only Consent Mode default missing: " + token);
}
assert.ok(
  webAdsRuntime.includes('script#google-consent-mode-default'),
  "native cleanup must remove a legacy server-rendered Consent Mode script",
);

console.log("Service-worker advertising scope contract passed.");

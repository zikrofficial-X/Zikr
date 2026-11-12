import { readFileSync } from "node:fs";

const layout = readFileSync("src/app/layout.tsx", "utf8");
const advertisingRuntime = readFileSync(
  "src/components/layout/web-advertising-runtime.tsx",
  "utf8",
);

const consentDefault = advertisingRuntime.indexOf("gtag('consent', 'default'");
const consentDefaultCall = advertisingRuntime.indexOf("installConsentModeDefaults();");
const cmpScript = advertisingRuntime.indexOf('"google-funding-choices"');
const analytics = advertisingRuntime.indexOf('id="google-analytics-src"');
const tagManager = advertisingRuntime.indexOf('"google-tag-manager"');
const nativeGuard = advertisingRuntime.indexOf(
  "if (Capacitor.isNativePlatform())",
);
const canonicalOriginGuard = advertisingRuntime.indexOf(
  "if (!isCanonicalProductionOrigin())",
);

if (consentDefault < 0 || consentDefaultCall < 0) {
  throw new Error(
    "Google Consent Mode defaults must be defined and installed before loading Google tags",
  );
}
if (
  layout.includes('id="google-consent-mode-default"') ||
  layout.includes('name="google-adsense-account"') ||
  layout.includes("window.adsbygoogle") ||
  layout.includes("requestNonPersonalizedAds = 1")
) {
  throw new Error(
    "Consent Mode and AdSense publisher globals must not be emitted in the server-rendered native layout",
  );
}
for (const token of [
  "ad_storage: 'denied'",
  "analytics_storage: 'denied'",
  "ad_user_data: 'denied'",
  "ad_personalization: 'denied'",
  "personalization_storage: 'denied'",
  "ads_data_redaction",
  "requestNonPersonalizedAds = 1",
]) {
  if (!advertisingRuntime.includes(token)) {
    throw new Error("Google Consent Mode default missing from web-only runtime: " + token);
  }
}

if (cmpScript < 0 || tagManager < cmpScript) {
  throw new Error(
    "Funding Choices and GTM must load from the web-only advertising runtime in the expected order",
  );
}
for (const index of [nativeGuard, canonicalOriginGuard]) {
  if (index < 0 || index > consentDefaultCall) {
    throw new Error(
      "Native and canonical-origin guards must run before Consent Mode defaults can be installed",
    );
  }
}
if (
  consentDefaultCall > cmpScript ||
  consentDefaultCall > tagManager ||
  analytics < 0 ||
  consentDefaultCall > analytics
) {
  throw new Error(
    "Consent Mode defaults must be installed after both guards and before Funding Choices, GTM, and GA4",
  );
}
if (!advertisingRuntime.includes('script#google-consent-mode-default')) {
  throw new Error("Native cleanup must remove any legacy Consent Mode script.");
}
if (
  layout.includes('id="google-funding-choices"') ||
  layout.includes('id="google-tag-manager"')
) {
  throw new Error(
    "Funding Choices and GTM must not be emitted in the server-rendered native layout",
  );
}
if (layout.includes("ns.html?id=") || layout.includes("<noscript>")) {
  throw new Error(
    "GTM noscript iframe bypasses the consent gate and must remain disabled",
  );
}

console.log("Consent-mode contract passed.");

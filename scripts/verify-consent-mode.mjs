import { readFileSync } from "node:fs";

const layout = readFileSync("src/app/layout.tsx", "utf8");
const advertisingRuntime = readFileSync(
  "src/components/layout/web-advertising-runtime.tsx",
  "utf8",
);

const consentDefault = layout.indexOf("gtag('consent', 'default'");
const cmpScript = advertisingRuntime.indexOf('"google-funding-choices"');
const analytics = layout.indexOf('id="google-analytics-src"');
const tagManager = advertisingRuntime.indexOf('"google-tag-manager"');
const nativeGuard = advertisingRuntime.indexOf(
  "if (Capacitor.isNativePlatform())",
);

if (consentDefault < 0) {
  throw new Error(
    "Google Consent Mode must default to denied before loading Google tags",
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
  if (!layout.includes(token)) {
    throw new Error("Google Consent Mode default missing: " + token);
  }
}

if (cmpScript < 0 || tagManager < cmpScript) {
  throw new Error(
    "Funding Choices and GTM must load from the web-only advertising runtime in the expected order",
  );
}
if (nativeGuard < 0 || nativeGuard > cmpScript) {
  throw new Error(
    "The native-platform early return must run before Funding Choices and GTM can load",
  );
}
for (const token of [
  "fundingchoicesmessages.google.com/i/fundingchoicesmessages.js",
  "https://www.googletagmanager.com/gtm.js?id=",
]) {
  if (!advertisingRuntime.includes(token)) {
    throw new Error("Web-only third-party tag loader is missing: " + token);
  }
}
if (analytics < 0 || analytics < consentDefault) {
  throw new Error(
    "Google Analytics must load only after the denied-by-default consent state is established",
  );
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

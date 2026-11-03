import { readFileSync } from "node:fs";

const layout = readFileSync("src/app/layout.tsx", "utf8");
const deferred = readFileSync("src/components/layout/runtime-effects.tsx", "utf8");

const consentDefault = layout.indexOf("gtag('consent', 'default'");
const cmpScript = layout.indexOf('id="google-funding-choices"');
const analytics = layout.indexOf('id="google-analytics-src"');
const tagManager = layout.indexOf('id="google-tag-manager"');

if (consentDefault < 0) throw new Error("Google Consent Mode must default to denied before loading Google tags");
for (const token of [
  "ad_storage: 'denied'",
  "analytics_storage: 'denied'",
  "ad_user_data: 'denied'",
  "ad_personalization: 'denied'",
  "personalization_storage: 'denied'",
  "ads_data_redaction",
  "requestNonPersonalizedAds = 1",
]) {
  if (!layout.includes(token)) throw new Error("Google Consent Mode default missing: " + token);
}

if (cmpScript < 0 || cmpScript < consentDefault) {
  throw new Error("Google Funding Choices must load from the root layout after the denied-by-default consent state is established");
}
const cmpMarkup = layout.slice(cmpScript, layout.indexOf("/>", cmpScript) + 2);
for (const token of [
  "fundingchoicesmessages.google.com/i/fundingchoicesmessages.js",
  'strategy="beforeInteractive"',
]) {
  if (!cmpMarkup.includes(token)) {
    throw new Error("Root-layout Funding Choices script is missing: " + token);
  }
}
if (analytics < 0 || tagManager < 0 || analytics < cmpScript || tagManager < cmpScript) {
  throw new Error("Google Analytics and Tag Manager must load only after the consent default and CMP loader");
}
if (deferred.includes("GoogleFundingChoices")) {
  throw new Error("Google Funding Choices must not be loaded a second time from deferred runtime effects");
}
if (layout.includes("<GoogleFundingChoices")) {
  throw new Error("Funding Choices must be declared directly in app/layout.tsx, not through an extracted component");
}
if (layout.includes("ns.html?id=") || layout.includes("<noscript>")) {
  throw new Error("GTM noscript iframe bypasses the consent gate and must remain disabled");
}

console.log("Consent-mode contract passed.");

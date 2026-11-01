import { readFileSync } from "node:fs";

const layout = readFileSync("src/app/layout.tsx", "utf8");
const cmp = readFileSync("src/components/layout/google-funding-choices.tsx", "utf8");
const deferred = readFileSync("src/components/layout/runtime-effects.tsx", "utf8");

const consentDefault = layout.indexOf("gtag('consent', 'default'");
const cmpMount = layout.indexOf("<GoogleFundingChoices />");
const analytics = layout.indexOf('id="google-analytics-src"');
const tagManager = layout.indexOf('id="google-tag-manager"');

if (consentDefault < 0) throw new Error("Google Consent Mode must default to denied before loading Google tags");
for (const token of [
  "ad_storage: 'denied'",
  "analytics_storage: 'denied'",
  "ad_user_data: 'denied'",
  "ad_personalization: 'denied'",
  "ads_data_redaction",
]) {
  if (!layout.includes(token)) throw new Error("Google Consent Mode default missing: " + token);
}
if (cmpMount < 0 || cmpMount < consentDefault) {
  throw new Error("Google Funding Choices must load after the denied-by-default consent state is established");
}
if (analytics < 0 || tagManager < 0 || analytics < cmpMount || tagManager < cmpMount) {
  throw new Error("Google Analytics and Tag Manager must load only after the consent default and CMP loader");
}
if (!cmp.includes('strategy="beforeInteractive"')) {
  throw new Error("Google Funding Choices must load before analytics and advertising tags");
}
if (deferred.includes("GoogleFundingChoices")) {
  throw new Error("Google Funding Choices must not be loaded a second time from deferred runtime effects");
}
if (layout.includes("ns.html?id=") || layout.includes("<noscript>")) {
  throw new Error("GTM noscript iframe bypasses the consent gate and must remain disabled");
}

console.log("Consent-mode contract passed.");

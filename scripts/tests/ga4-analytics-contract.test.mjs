import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const service = readFileSync("src/features/admin/services/traffic-revenue.ts", "utf8");
const panel = readFileSync("src/features/admin/components/traffic-revenue-panel.tsx", "utf8");
const envValidator = readFileSync("scripts/validate-deployment-env.mjs", "utf8");
const environmentDocs = readFileSync("docs/environment-variables.md", "utf8");
assert.match(service, /GA4_REFRESH_TOKEN/);
assert.match(environmentDocs, /GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are server-only GA4 OAuth credentials/);
assert.doesNotMatch(environmentDocs, /Obsolete Google OAuth application variables/);
assert.match(envValidator, /"GOOGLE_CLIENT_ID"/);
assert.match(envValidator, /"GOOGLE_CLIENT_SECRET"/);
assert.match(envValidator, /"GA4_REFRESH_TOKEN"/);
assert.match(envValidator, /"GA4_PROPERTY_ID"/);
assert.match(envValidator, /Legacy public Google client variable/);
assert.doesNotMatch(envValidator, /GOOGLE_CLIENT_ID\/GOOGLE_CLIENT_SECRET\/NEXT_PUBLIC_GOOGLE_CLIENT_ID are obsolete/);
assert.match(service, /GA4_PROPERTY_ID/);
assert.match(service, /analyticsdata\.googleapis\.com/);
assert.match(service, /sessionDefaultChannelGroup/);
assert.match(service, /landingPagePlusQueryString/);
assert.match(service, /activeUsers/);
assert.match(service, /sessions/);
assert.match(service, /screenPageViews/);
assert.match(service, /engagementRate/);
assert.match(service, /keyEvents/);
assert.match(service, /authorization_required/);
const ga4CacheDefinition = service.slice(
  service.indexOf("const getCachedGa4AnalyticsSnapshot"),
  service.indexOf("export type TrafficRevenueSnapshot"),
);
assert.match(ga4CacheDefinition, /const getCachedGa4AnalyticsSnapshot = unstable_cache/);
assert.match(ga4CacheDefinition, /\(_credentialFingerprint: string\) => fetchGa4AnalyticsSnapshot\(\)/);
assert.match(ga4CacheDefinition, /zikr-ga4-analytics-readonly-v2/);
assert.match(service, /getCachedGa4AnalyticsSnapshot\(ga4CredentialFingerprint\)/);
const youtubeFingerprintStart = service.indexOf("const youtubeCredentialFingerprint = createHash");
const ga4FingerprintStart = service.indexOf("const ga4CredentialFingerprint = createHash");
const ga4FingerprintEnd = service.indexOf("\n  const [", ga4FingerprintStart);
const youtubeFingerprintBlock = service.slice(youtubeFingerprintStart, ga4FingerprintStart);
const ga4FingerprintBlock = service.slice(ga4FingerprintStart, ga4FingerprintEnd);
assert.ok(youtubeFingerprintStart >= 0 && ga4FingerprintStart > youtubeFingerprintStart);
assert.ok(ga4FingerprintEnd > ga4FingerprintStart, "GA4 fingerprint block must end before the metrics request.");
for (const value of ["process.env.YOUTUBE_CLIENT_ID", "process.env.YOUTUBE_CLIENT_SECRET", "youtubeRefreshToken"]) {
  assert.ok(youtubeFingerprintBlock.includes(value), `YouTube cache fingerprint must include ${value}.`);
}
for (const value of ["process.env.GOOGLE_CLIENT_ID", "process.env.GOOGLE_CLIENT_SECRET", "process.env.GA4_REFRESH_TOKEN", "process.env.GA4_PROPERTY_ID"]) {
  assert.ok(ga4FingerprintBlock.includes(value), `GA4 cache fingerprint must include ${value}.`);
}
assert.match(service, /getCachedYoutubeAnalyticsSnapshot\(youtubeCredentialFingerprint\)/);
assert.match(service, /unstable_cache/);
assert.match(panel, /Google Analytics 4/);
assert.match(panel, /المستخدمون النشطون/);
assert.match(panel, /قنوات الزيارات/);
assert.match(panel, /أهم صفحات الدخول/);
console.log("✅ GA4 read-only reporting contracts passed.");

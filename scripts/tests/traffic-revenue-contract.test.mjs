import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const service = readFileSync("src/features/admin/services/traffic-revenue.ts", "utf8");
const panel = readFileSync("src/features/admin/components/traffic-revenue-panel.tsx", "utf8");
const page = readFileSync("src/app/admin/analytics/page.tsx", "utf8");
const metricsHelper = readFileSync("src/features/admin/services/traffic-revenue-metrics.ts", "utf8");

assert.match(service, /select\("id", \{ count: "exact", head: true \}\)/);
assert.match(service, /social_publish_queue/);
assert.match(service, /video_generation_requests/);
assert.match(service, /from\("articles"\)/);
assert.match(service, /from\("videos"\)/);
assert.match(service, /from\("social_platform_profiles"\)/);
assert.match(service, /social_platform_profiles[\s\S]*select\("platform,name,handle,status,synced_at"\)/);
assert.doesNotMatch(service, /\.select\([^)]*(?:page_access_token|access_token|refresh_token)/i);
assert.doesNotMatch(service, /socialProfiles:\s*\[[\s\S]*?(?:page_access_token|access_token|refresh_token)/i);
assert.match(service, /GA4_REFRESH_TOKEN/);
assert.match(service, /GA4_PROPERTY_ID/);
assert.match(service, /analyticsdata\.googleapis\.com/);
assert.match(service, /sessionDefaultChannelGroup/);
assert.match(service, /landingPagePlusQueryString/);
assert.match(service, /getCachedGa4AnalyticsSnapshot/);
assert.match(service, /ga4ReportingConnected: ga4Analytics\.status === "connected"/);
assert.match(panel, /Google Analytics 4/);
assert.match(panel, /قنوات الزيارات/);
assert.match(panel, /أهم صفحات الدخول/);
assert.match(service, /monetagReportingConnected: false/);
assert.match(service, /return result\.error \? null : \(result\.count \?\? 0\)/);
assert.match(panel, /getTrafficRevenueSnapshot/);
assert.match(panel, /غير متاح/);
assert.match(panel, /لا يستخدم هذا المحرك تحديث الصفحات أو النقرات الاصطناعية/);
assert.match(page, /requireAdminPermission\("analytics\.read"\)/);
assert.match(page, /<TrafficRevenuePanel\s*\/>/);


assert.match(service, /socialProcessing/);
assert.match(service, /socialPartial/);
assert.match(service, /videoRetryPending/);
assert.match(service, /socialCreated24h/);
assert.match(service, /socialPublished7d/);
assert.match(service, /videoRequested24h/);
assert.match(service, /videoCompleted7d/);
assert.match(service, /averageRenderDurationMs7d/);
assert.match(service, /timezone: "UTC"/);
assert.match(metricsHelper, /metadata\.platformResults/);
assert.match(metricsHelper, /remoteIds \+= 1/);
assert.match(service, /platformRowsComplete/);
assert.match(metricsHelper, /total !== rows\.length/);
assert.match(service, /isCompleteBoundedRead\(platformCount, \(platformRows\.data \?\? \[\]\)\.length, 1000\)/);
assert.doesNotMatch(panel, /remoteId\s*:/i);
assert.match(panel, /نتائج النشر لكل منصة/);
assert.match(panel, /آخر 24 ساعة و7 أيام/);
assert.match(panel, /المعرّفات البعيدة/);

console.log("✅ Traffic & Revenue contracts passed.");

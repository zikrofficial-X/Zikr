import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const service = readFileSync("src/features/admin/services/traffic-revenue.ts", "utf8");
const panel = readFileSync("src/features/admin/components/traffic-revenue-panel.tsx", "utf8");
const page = readFileSync("src/app/admin/analytics/page.tsx", "utf8");
const metricsHelper = readFileSync("src/features/admin/services/traffic-revenue-metrics.ts", "utf8");

assert.match(service, /select\("id", \{ count: "exact", head: true \}\)/);
assert.match(service, /video_generation_requests/);
assert.match(service, /from\("articles"\)/);
assert.match(service, /from\("videos"\)/);
assert.doesNotMatch(service, /social_publish_queue|social_platform_profiles|socialProfiles|socialPlatformStats/);
assert.doesNotMatch(service, /socialQueued|socialPublished|socialCreated24h|socialFailed/);
assert.doesNotMatch(service, /\.select\([^)]*(?:page_access_token|access_token)/i);
assert.match(service, /GA4_REFRESH_TOKEN/);
assert.match(service, /GA4_PROPERTY_ID/);
assert.match(service, /analyticsdata\.googleapis\.com/);
assert.match(service, /sessionDefaultChannelGroup/);
assert.match(service, /landingPagePlusQueryString/);
assert.match(service, /getCachedGa4AnalyticsSnapshot/);
assert.match(service, /ga4ReportingConnected: ga4Analytics\.status === "connected"/);
assert.match(service, /getYouTubeRefreshToken/);
assert.match(service, /getCachedYoutubeAnalyticsSnapshot/);
assert.match(service, /monetagReportingConnected: false/);
assert.match(service, /return result\.error \? null : \(result\.count \?\? 0\)/);
assert.match(panel, /Google Analytics 4/);
assert.match(panel, /قنوات الزيارات/);
assert.match(panel, /أهم صفحات الدخول/);
assert.match(panel, /تحليلات قناة YouTube/);
assert.match(panel, /Monetag/);
assert.match(panel, /getTrafficRevenueSnapshot/);
assert.match(panel, /غير متاح/);
assert.match(panel, /لا يستخدم هذا المحرك تحديث الصفحات أو النقرات الاصطناعية/);
assert.doesNotMatch(panel, /facebook|instagram|tiktok|pinterest|whatsapp|مركز النشر الاجتماعي|نتائج النشر لكل منصة/i);
assert.match(panel, /api\/admin\/social\/youtube\/connect/);
assert.match(page, /requireAdminPermission\("analytics\.read"\)/);
assert.match(page, /<TrafficRevenuePanel\s*\/>/);
assert.doesNotMatch(page, /YOUTUBE_REDIRECT|api\/admin\/social\/youtube\/connect/);

assert.match(service, /videoRetryPending/);
assert.match(service, /videoRequested24h/);
assert.match(service, /videoCompleted7d/);
assert.match(service, /averageRenderDurationMs7d/);
assert.match(service, /timezone: "UTC"/);
assert.match(metricsHelper, /averageRenderDuration/);
assert.doesNotMatch(metricsHelper, /platformResults|remoteIds|SocialPlatform/);

console.log("✅ Internal analytics and revenue contracts passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const service = readFileSync("src/features/admin/services/traffic-revenue.ts", "utf8");
const panel = readFileSync("src/features/admin/components/traffic-revenue-panel.tsx", "utf8");
const page = readFileSync("src/app/admin/analytics/page.tsx", "utf8");

assert.match(service, /select\("id", \{ count: "exact", head: true \}\)/);
assert.match(service, /social_publish_queue/);
assert.match(service, /video_generation_requests/);
assert.match(service, /from\("articles"\)/);
assert.match(service, /from\("videos"\)/);
assert.match(service, /from\("social_platform_profiles"\)/);
assert.match(service, /social_platform_profiles[\s\S]*select\("platform,name,handle,status,synced_at"\)/);
assert.doesNotMatch(service, /\.select\([^)]*(?:page_access_token|access_token|refresh_token)/i);\nassert.doesNotMatch(service, /socialProfiles:\s*\[[\s\S]*?(?:page_access_token|access_token|refresh_token)/i);
assert.match(service, /ga4ReportingConnected: false/);
assert.match(service, /monetagReportingConnected: false/);
assert.match(service, /return result\.error \? null : \(result\.count \?\? 0\)/);
assert.match(panel, /getTrafficRevenueSnapshot/);
assert.match(panel, /غير متاح/);
assert.match(panel, /لا يستخدم هذا المحرك تحديث الصفحات أو النقرات الاصطناعية/);
assert.match(page, /requireAdminPermission\("analytics\.read"\)/);
assert.match(page, /<TrafficRevenuePanel\s*\/>/);

console.log("✅ Traffic & Revenue contracts passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const service = readFileSync("src/features/admin/services/traffic-revenue.ts", "utf8");
const panel = readFileSync("src/features/admin/components/traffic-revenue-panel.tsx", "utf8");

assert.match(service, /YOUTUBE_CLIENT_ID/);
assert.match(service, /YOUTUBE_CLIENT_SECRET/);
assert.match(service, /getYouTubeRefreshToken/);
assert.match(service, /await getYouTubeRefreshToken\(\)/);
assert.match(service, /yt-analytics|youtubeanalytics\.googleapis\.com/);
assert.match(service, /insightTrafficSourceType/);
assert.match(service, /estimatedMinutesWatched/);
assert.match(service, /averageViewDuration/);
assert.match(service, /subscribersGained/);
assert.match(service, /subscribersLost/);
assert.match(service, /unstable_cache/);
assert.match(service, /authorization_required/);
assert.match(service, /youtubeAnalyticsConnected/);
assert.doesNotMatch(service, /console\.(log|error|warn)\([^\n]*(accessToken|refreshToken|clientSecret)/i);
assert.match(panel, /تحليلات قناة YouTube/);
assert.match(panel, /إعادة تفويض/);
assert.match(panel, /مصادر الزيارات إلى فيديوهات القناة/);
assert.match(panel, /متوسط مدة المشاهدة/);
console.log("✅ YouTube Analytics authorization and reporting contracts passed.");

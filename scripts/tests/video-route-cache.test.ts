import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath = new URL("../../src/app/videos/[slug]/page.tsx", import.meta.url);
const source = readFileSync(routePath, "utf8");

assert.match(source, /import \{ cache \} from ['"]react['"]/);
assert.match(
  source,
  /const loadVideo = cache\(\(slug: string\) => getVideoBySlug\(slug\)\);/,
  "metadata and page rendering must share one request-scoped video lookup",
);
assert.equal(
  (source.match(/await loadVideo\(slug\)/g) ?? []).length,
  2,
  "both generateMetadata and the page must use the memoized lookup",
);
assert.doesNotMatch(
  source,
  /generateStaticParams|\bgetVideos\b/,
  "the force-dynamic, noindex detail route must not fetch the full videos catalogue during build",
);

console.log("✅ Video detail route cache/build contract passed");

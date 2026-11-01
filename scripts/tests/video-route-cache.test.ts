import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routePath = new URL("../../src/app/videos/[slug]/page.tsx", import.meta.url);
const source = readFileSync(routePath, "utf8");

assert.match(source, /import \{ cache \} from ['"]react['"]/);
assert.match(source, /const loadVideo = cache\(\(slug: string\) => getVideoBySlug\(slug\)\);/);
assert.equal((source.match(/await loadVideo\(slug\)/g) ?? []).length, 2);
assert.doesNotMatch(source, /generateStaticParams|\bgetVideos\b/);
console.log("✅ Video detail route cache/build contract passed");

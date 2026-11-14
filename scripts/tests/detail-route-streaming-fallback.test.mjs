import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const videoPage = readFileSync("src/app/videos/[slug]/page.tsx", "utf8");
const duaPage = readFileSync("src/app/dua/[slug]/page.tsx", "utf8");
const videoService = readFileSync("src/features/videos/services/videos.ts", "utf8");

for (const [name, source] of [["video", videoPage], ["dua", duaPage]]) {
  assert.doesNotMatch(source, /from ['"]next\/navigation['"]/,
    `${name} detail route must not throw a late Next notFound boundary during streaming`);
  assert.doesNotMatch(source, /\bnotFound\s*\(/,
    `${name} detail route must render an inline not-found state`);
}
assert.match(videoPage, /if \(!video\)\s*\{\s*return\s*\(/,
  "video route must return its inline missing-content state before reading video fields");
assert.match(videoPage, /noindex:\s*true/,
  "video detail pages must remain excluded from indexing");
assert.match(duaPage, /if \(!hasPublicDuaContent\(dua\)\)\s*\{\s*return\s*\(/,
  "dua route must return its inline missing/unapproved-content state before dereferencing the dua");
assert.match(duaPage, /noindex:\s*!hasPublicDuaContent\(dua\)/,
  "missing or unapproved dua details must remain noindex");
const videoBySlug = videoService.slice(
  videoService.indexOf("export async function getVideoBySlug"),
  videoService.indexOf("function hasPassedKidsVideoQa"),
);
assert.match(videoBySlug, /timeoutMs:\s*8000,\s*retries:\s*1,\s*cache:\s*["']no-store["']/,
  "video-by-slug Supabase lookup must bypass stale caches after moderation with a bounded timeout and one retry");
assert.doesNotMatch(videoBySlug, /next:\s*\{\s*revalidate:/,
  "video-by-slug lookup must not retain a positive Next data-cache lifetime after moderation");

console.log("✅ Dynamic content detail routes render missing-content states without late streaming notFound throws");

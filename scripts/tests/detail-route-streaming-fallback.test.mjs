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
assert.match(videoService, /timeoutMs:\s*8000,\s*retries:\s*1,\s*cache:\s*["']force-cache["']/,
  "video-by-slug Supabase lookup must use an explicit bounded timeout and one retry");
assert.match(videoService, /next:\s*\{\s*revalidate:\s*900\s*\}/,
  "video-by-slug lookup must preserve the established 15-minute revalidation policy");

console.log("✅ Dynamic content detail routes render missing-content states without late streaming notFound throws");

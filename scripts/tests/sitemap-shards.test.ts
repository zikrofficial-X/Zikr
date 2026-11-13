import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getSitemapShard,
  getSitemapShardCountForEntryCount,
  SITEMAP_PAGE_SIZE,
} from "../../src/lib/seo/sitemap-shards";

assert.equal(SITEMAP_PAGE_SIZE, 45_000);
assert.equal(getSitemapShardCountForEntryCount(0), 1);
assert.equal(getSitemapShardCountForEntryCount(45_000), 1);
assert.equal(getSitemapShardCountForEntryCount(45_001), 2);
assert.equal(getSitemapShardCountForEntryCount(50_000), 2);
assert.equal(getSitemapShardCountForEntryCount(90_001), 3);
assert.throws(() => getSitemapShardCountForEntryCount(-1), /non-negative safe integer/);
assert.throws(() => getSitemapShardCountForEntryCount(1.5), /non-negative safe integer/);

const entries = Array.from({ length: 90_001 }, (_, index) => "https://example.test/" + index);
assert.equal(getSitemapShard(entries, 0).length, 45_000);
assert.equal(getSitemapShard(entries, 1).length, 45_000);
assert.deepEqual(getSitemapShard(entries, 2), entries.slice(90_000));
assert.deepEqual(getSitemapShard(entries, 3), []);
assert.deepEqual(getSitemapShard(entries, -1), []);

const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");
const shardRouteSource = readFileSync("src/app/sitemap-content/[id]/route.ts", "utf8");
const indexRouteSource = readFileSync("src/app/sitemap-index.xml/route.ts", "utf8");
assert.match(sitemapSource, /uniqueRoutes\(\[\.\.\.staticRoutes, \.\.\.dynamicRoutes\]\);/);
assert.match(sitemapSource, /getSitemapShardCountForEntryCount\(entries\.length\)/);
assert.match(sitemapSource, /getSitemapShard\(await getSitemapEntries\(\), 0\)/);
assert.doesNotMatch(sitemapSource, /SITEMAP_URL_LIMIT|slice\(0,\s*50_000\)/);
assert.match(shardRouteSource, /getSitemapShard\(allEntries, id\)/);
assert.doesNotMatch(shardRouteSource, /SITEMAP_PAGE_SIZE\s*=/);
assert.match(indexRouteSource, /getSitemapShardCount\(\)/);
assert.match(indexRouteSource, /sitemap-content\/\$\{id\}\.xml/);
const robotsSource = readFileSync("src/app/robots.ts", "utf8");
assert.ok(
  robotsSource.includes('sitemap: `${baseUrl}/sitemap-index.xml`'),
  "robots.txt must advertise the sitemap index so every generated shard is discoverable",
);
assert.ok(
  !robotsSource.includes('sitemap: `${baseUrl}/sitemap.xml`'),
  "robots.txt must not advertise only the first URL shard as the complete sitemap",
);


console.log("Sitemap shard sizing, indexing, and route alignment contracts passed.");

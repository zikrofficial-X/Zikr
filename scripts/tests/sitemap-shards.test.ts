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
const storiesServiceSource = readFileSync("src/features/stories/services/stories.ts", "utf8");
assert.match(storiesServiceSource, /new Map<number, \{ data: Story\[\]; timestamp: number \}>/);
assert.match(storiesServiceSource, /cachedStories\.get\(safeLimit\)/);
assert.match(storiesServiceSource, /Math\.min\(1000, Math\.floor\(limit\) \|\| 1\)/);
assert.match(storiesServiceSource, /limit=\$\{safeLimit\}/);
const articleServiceSource = readFileSync("src/features/articles/services/articles.ts", "utf8");
assert.match(articleServiceSource, /Math\.min\(1000, Math\.trunc\(limit\)\)/);
const duaServiceSource = readFileSync("src/features/dua/services/dua.ts", "utf8");
assert.match(duaServiceSource, /Math\.min\(1000, Math\.trunc\(limit\)\)/);
const libraryServiceSource = readFileSync("src/features/content-library/services/content-library.ts", "utf8");
assert.match(libraryServiceSource, /Math\.min\(1000, Math\.trunc\(limit\)\)/);
const scholarsServiceSource = readFileSync("src/features/scholars/services/scholars.ts", "utf8");
assert.match(scholarsServiceSource, /&limit=1000&order=created_at\.desc/);
assert.match(sitemapSource, /getStories\(1000\)/);
const storyDetailLookup = storiesServiceSource.slice(storiesServiceSource.indexOf("export async function getStoryBySlug"));
assert.match(storyDetailLookup, /getStories\(1000\)/, "story detail lookup must cover every story admitted to the sitemap catalogue");
assert.match(sitemapSource, /getDuas\(undefined, 1000\)/);
assert.match(sitemapSource, /getPublicContentLibrary\(1000\)/);
assert.match(sitemapSource, /getArticles\(undefined, 1000\)/);

const llmsSource = readFileSync("src/app/llms.txt/route.ts", "utf8");
assert.match(llmsSource, /siteConfig\.url\.replace/);
assert.match(llmsSource, /Public sitemap index: \$\{SITE_URL\}\/sitemap-index\.xml/);
assert.doesNotMatch(llmsSource, /Public sitemap: \$\{SITE_URL\}\/sitemap\.xml/);
assert.doesNotMatch(llmsSource, /https:\/\/zikrmediaofficial\.vercel\.app/);

const robotsSource = readFileSync("src/app/robots.ts", "utf8");
assert.ok(
  robotsSource.includes('sitemap: `${baseUrl}/sitemap-index.xml`'),
  "robots.txt must advertise the sitemap index so every generated shard is discoverable",
);
assert.ok(
  !robotsSource.includes('sitemap: `${baseUrl}/sitemap.xml`'),
  "robots.txt must not advertise only the first URL shard as the complete sitemap",
);
const adminSeoSource = readFileSync("src/app/admin/seo/page.tsx", "utf8");
assert.ok(
  adminSeoSource.includes('href="/sitemap-index.xml"'),
  "the admin SEO surface must link to the complete sitemap index, not only shard zero",
);
assert.doesNotMatch(
  adminSeoSource,
  /href="\/sitemap\.xml"/,
  "the admin SEO surface must not advertise the first sitemap shard as the complete index",
);


console.log("Sitemap shard sizing, indexing, and route alignment contracts passed.");

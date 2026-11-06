import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [adminContent, siteContent, publisher, databaseTypes] = await Promise.all([
  read("../../src/features/admin/services/content.ts"),
  read("../../src/features/site-content/services/site-content.ts"),
  read("../jobs/content-publishing.ts"),
  read("../../src/lib/types/supabase.ts"),
]);

assert.match(adminContent, /\.from\("pinned_messages"\)\s*\.select\("id, title, published, created_at, updated_at"\)/);
assert.match(adminContent, /published:\s*item\.published\s*\?\?\s*false/);
assert.doesNotMatch(adminContent, /is_active/);

assert.match(siteContent, /\.from\('pinned_messages'\)\s*\.select\('id, title, body, cta_label, cta_href, published, created_at'\)\s*\.eq\('published', true\)/);
assert.doesNotMatch(siteContent, /\.eq\('is_active'/);

assert.match(publisher, /body:\s*JSON\.stringify\(\{\s*published:\s*true,\s*updated_at:\s*now,/s);
assert.doesNotMatch(publisher, /content_table\s*===\s*"pinned_messages"\s*\?\s*"is_active"/);

const typeStart = databaseTypes.indexOf("      pinned_messages:");
const typeEnd = databaseTypes.indexOf("      prayer_locations:", typeStart);
assert.notEqual(typeStart, -1);
assert.notEqual(typeEnd, -1);
const pinnedTypes = databaseTypes.slice(typeStart, typeEnd);
assert.match(pinnedTypes, /published: boolean/);
assert.doesNotMatch(pinnedTypes, /is_active/);

console.log("Pinned messages live-schema contract passed.");

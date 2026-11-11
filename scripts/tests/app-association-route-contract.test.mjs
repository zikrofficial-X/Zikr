import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const aasa = read("../../src/app/.well-known/apple-app-site-association/route.ts");
const assetLinks = read("../../src/app/.well-known/assetlinks.json/route.ts");
const isForceStaticRoute = (source) =>
  /export\s+const\s+dynamic\s*=\s*(['"])force-static\1;/.test(source);

assert.ok(aasa.includes("process.env.IOS_ASSOCIATED_DOMAIN_APP_ID"));
assert.ok(assetLinks.includes("process.env.ANDROID_APP_LINKS_SHA256"));
assert.ok(assetLinks.includes("CURRENT_RELEASE_FINGERPRINT"));
assert.ok(isForceStaticRoute(aasa), "iOS association route must be force-static");
assert.ok(isForceStaticRoute(assetLinks), "Android association route must be force-static");

console.log("App association route contract passed.");

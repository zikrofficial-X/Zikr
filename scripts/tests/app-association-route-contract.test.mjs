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

const iosProject = read("../../ios/App/App.xcodeproj/project.pbxproj");
const debugEntitlements = read("../../ios/App/App/AppDebug.entitlements");
const releaseEntitlements = read("../../ios/App/App/App.entitlements");
const entitlementsBindings = [...iosProject.matchAll(/CODE_SIGN_ENTITLEMENTS = ([^;]+);/g)].map((match) => match[1]);
assert.deepEqual(
  entitlementsBindings,
  ["App/AppDebug.entitlements", "App/App.entitlements"],
  "iOS Debug and Release must use separate APNs entitlement environments",
);
assert.match(debugEntitlements, /<key>aps-environment<\\/key>\\s*<string>development<\\/string>/);
assert.match(releaseEntitlements, /<key>aps-environment<\\/key>\\s*<string>production<\\/string>/);
for (const source of [debugEntitlements, releaseEntitlements]) {
  assert.ok(source.includes("applinks:zikrmediaofficial.vercel.app"), "both build configurations must retain the Universal Links entitlement");
}


console.log("App association route contract passed.");

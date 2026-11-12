import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const button = read("src/features/auth/components/google-oauth-button.tsx");
const activity = read("android/app/src/main/java/com/zikr/app/MainActivity.java");
const pkg = JSON.parse(read("package.json"));
const lock = read("pnpm-lock.yaml");
const proxy = read("src/proxy.ts");
const authActions = read("src/features/auth/actions.ts");
const googleOAuth = read("src/features/auth/integrations/google-oauth.ts");
const androidManifest = read("android/app/src/main/AndroidManifest.xml");
const nativeBridge = read("src/components/layout/native-capacitor-bridge.tsx");
const authCallback = read("src/app/auth/callback/route.ts");
const appleAssociationRoute = read("src/app/.well-known/apple-app-site-association/route.ts");
const projectIntegrity = read("scripts/verify-project-integrity.mjs");
assert.ok(
  projectIntegrity.includes("name.startsWith('@capgo/')"),
  "project integrity must recognize installed @capgo native plugins in the mobile dependency manifest",
);
const capacitor = JSON.parse(read("capacitor.config.json"));
const mobileDependencies = JSON.parse(read("mobile/capacitor-dependencies.json"));
const packageDependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const manifestDependencies = { ...(mobileDependencies.dependencies || {}), ...(mobileDependencies.devDependencies || {}) };
const nativeDependencyNames = name => /^(?:@capacitor|@capawesome|@capgo)\//.test(name);
assert.deepEqual(
  Object.keys(manifestDependencies).filter(nativeDependencyNames).sort(),
  Object.keys(packageDependencies).filter(nativeDependencyNames).sort(),
  "the mobile dependency manifest must contain every installed native package and no stale native packages",
);
for (const dependency of Object.keys(packageDependencies).filter(nativeDependencyNames)) {
  assert.equal(
    manifestDependencies[dependency],
    packageDependencies[dependency],
    `mobile dependency manifest version must match package.json for ${dependency}`,
  );
}
const iosProject = read("ios/App/App.xcodeproj/project.pbxproj");
const iosPodfile = read("ios/App/Podfile");
assert.equal(
  capacitor.ios?.scheme ?? "App",
  "App",
  "Capacitor ios.scheme must name the existing Xcode App scheme, not the custom URL scheme",
);
assert.match(iosProject, /name = App;/, "The Xcode project must contain the App target");
assert.match(iosPodfile, /target 'App' do/, "CocoaPods must target the same App scheme");
const iosDeploymentTargets = [...iosProject.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([0-9.]+);/g)]
  .map(match => match[1]);
assert.ok(
  iosDeploymentTargets.length > 0 && iosDeploymentTargets.every(target => target === "15.0"),
  "Every Xcode configuration must target iOS 15.0, the supported minimum for Capacitor 7",
);
assert.match(iosPodfile, /platform :ios, '15\.0'/, "CocoaPods must use the same iOS 15.0 deployment minimum");
const iosPlist = read("ios/App/App/Info.plist");
const appBoundDomainBlock = iosPlist.split("<key>WKAppBoundDomains</key>")[1]?.split("</array>")[0] ?? "";
const appBoundDomains = new Set(
  appBoundDomainBlock.split("<string>").slice(1).map(value => value.split("</string>")[0]).filter(Boolean),
);
assert.ok(appBoundDomains.has("localhost"), "Capacitor local bridge hostname must be app-bound when navigation limits are enabled");
for (const host of ["www.youtube.com", "www.youtube-nocookie.com"]) {
  assert.ok(capacitor.server?.allowNavigation?.includes(host), `${host} must remain an allowed Capacitor destination`);
  assert.ok(appBoundDomains.has(host), `${host} must be app-bound when WKWebView navigation limits are enabled`);
}
assert.ok(appBoundDomains.size <= 10, "WKAppBoundDomains must not exceed Apple’s 10-domain limit");

assert.ok(pkg.dependencies?.["@capgo/capacitor-social-login"], "Capgo Social Login dependency is required");
assert.ok(lock.includes("@capgo/capacitor-social-login@7.20.0"), "pnpm lockfile must include the resolved native plugin");
assert.ok(button.includes('Capacitor.getPlatform() === "android"'), "Android must have a dedicated native login branch");
assert.ok(button.includes("SocialLogin.initialize("), "Native Google plugin must be initialized");
assert.ok(button.includes("SocialLogin.login("), "Native Google Credential Manager must be invoked");
assert.ok(button.includes("supabase.auth.signInWithIdToken("), "Google ID token must be exchanged with Supabase");
assert.ok(button.includes("NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID"), "Native login must use the Web OAuth client ID");
assert.doesNotMatch(
  button,
  /host\.endsWith\("\.vercel\.app"\)/,
  "untrusted Vercel preview aliases must not bypass the exact Supabase redirect allowlist",
);
assert.ok(button.includes("return PRODUCTION_URL;"), "non-v0 browser OAuth must use the canonical production origin");
assert.match(read(".env.example"), /^NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=/m, "the public native OAuth client ID must be documented in the environment template");
assert.match(read("scripts/verify-mobile-readiness.mjs"), /NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID is required for Android native Google sign-in/, "store-readiness must fail when the native Google client ID is absent");
assert.ok(button.includes("window.location.replace(safeNext)"), "Native success must return to the in-app route");
assert.ok(button.includes('Capacitor.isPluginAvailable("SocialLogin")'), "Credential Manager must only run when the installed APK contains the native plugin");
assert.ok(button.includes("startBrowserGoogleOAuth("), "Native-compatible browser OAuth fallback must remain available");
assert.ok(button.includes("browserFallbackAvailable"), "Native Google failure must expose a browser fallback");
assert.ok(button.includes("المتابعة عبر المتصفح الآمن"), "Browser fallback must be visible to users");
assert.ok(button.includes("buildNativeOAuthRedirect(safeNext)"), "Native browser fallback must return through the app HTTPS/deep-link bridge");
assert.equal((button.match(/import\s*\{\s*sanitizeInternalPath\s*\}\s*from\s*["\']@\/lib\/safe-redirect["\'];/g) ?? []).length, 1, "Google button must import the redirect sanitizer exactly once");
assert.equal((authActions.match(/import\s*\{\s*sanitizeInternalPath\s*\}\s*from\s*["\']@\/lib\/safe-redirect["\'];/g) ?? []).length, 1, "Auth actions must import the redirect sanitizer exactly once");
assert.ok(button.includes('new URL("/auth/callback", PRODUCTION_URL)'), "Native browser fallback must use the canonical HTTPS callback origin");
assert.ok(button.includes('url.searchParams.set("native", "1")'), "Native callback must opt into the deep-link handoff");
assert.ok(button.includes('url.searchParams.set("next", nextPath)'), "Native callback must preserve only the sanitized in-app destination");
assert.doesNotMatch(
  androidManifest,
  /android:scheme="https"[\s\S]*?android:pathPrefix="\/auth\/callback"/,
  "Android must not intercept the HTTPS OAuth callback before the server can exchange its code",
);
assert.match(
  appleAssociationRoute,
  /\{\s*'\/':\s*'\/auth\/callback\*',\s*exclude:\s*true\s*\}/,
  "iOS universal links must leave OAuth callbacks in the browser for the server handoff",
);
assert.match(appleAssociationRoute, /IOS_ASSOCIATED_DOMAIN_APP_ID/);
assert.match(appleAssociationRoute, /status: 503/, "AASA must not return an empty success document when the Apple app ID is missing");
assert.match(appleAssociationRoute, /\[A-Z0-9\]\{10\}\\\.com\\\.zikr\\\.app/, "AASA must validate the Apple Team ID plus the registered bundle ID");
assert.match(appleAssociationRoute, /webcredentials:\s*\{\s*apps:\s*\[appId\]\s*\}/);
assert.match(read(".env.example"), /^IOS_ASSOCIATED_DOMAIN_APP_ID=/m, "the Apple Team ID and bundle ID must be documented in the environment template");
assert.ok(button.includes("Android OAuth غير مطابق"), "Credential Manager configuration errors must be explained accurately");
assert.ok(activity.includes("ModifiedMainActivityForSocialLoginPlugin"), "MainActivity must implement the required plugin marker interface");
assert.ok(activity.includes("handleGoogleLoginIntent"), "MainActivity must forward Google activity results");
assert.ok(proxy.includes('request.headers.get("host")'), "Canonical-host logic must inspect the incoming Host header");
assert.ok(proxy.includes('process.env.VERCEL_ENV === "production"'), "Preview deployments must not be redirected to production");
assert.ok(proxy.includes("PRODUCTION_URL"), "Production canonical host must come from the single source of truth");
assert.match(proxy, /isProductionDeployment\s*&&\s*requestHost !== canonicalHost/, "all non-canonical production hosts must redirect before auth cookie creation");
assert.ok(!proxy.includes('requestHost.endsWith(".vercel.app")'), "production canonicalization must cover custom domains as well as Vercel aliases");
assert.ok(googleOAuth.includes("request.nextUrl.origin !== canonicalOrigin.origin"), "OAuth start must reject a non-canonical cookie origin");
assert.ok(googleOAuth.includes("NextResponse.redirect(canonicalStart, 307)"), "OAuth start must redirect before generating PKCE state");
assert.ok(googleOAuth.includes('response.headers.set("Cache-Control", "private, no-store, max-age=0")'), "OAuth origin redirects must not be cached");

assert.match(nativeBridge, /addListener\?\.\("appUrlOpen"/);
assert.match(nativeBridge, /target\.origin !== PRODUCTION_URL/);
assert.match(nativeBridge, /target\.pathname\.startsWith\("\/auth\/callback"\)/);
assert.match(nativeBridge, /sanitizeInternalPath\(target\.pathname \+ target\.search \+ target\.hash\)/, "Universal-link paths must be sanitized before in-app navigation");
assert.match(nativeBridge, /window\.location\.assign\(path\)/);
assert.match(authCallback, /return redirectNoStore\(nativeUrl\)/, "native OAuth authorization codes must be handed off through a no-store redirect");
assert.match(authCallback, /Cache-Control.*private, no-store, max-age=0/, "all OAuth callback redirects must be private and non-cacheable");
assert.equal((authCallback.match(/NextResponse\.redirect\(/g) ?? []).length, 1, "only the no-store redirect helper may create callback redirects");
assert.match(androidManifest, /android:scheme="com\.zikr\.app"/);
assert.match(androidManifest, /<intent-filter android:autoVerify="true">[\s\S]*?android:host="zikrmediaofficial\.vercel\.app"/);
for (const routePrefix of ["/quran", "/hadith", "/articles", "/dua", "/stories", "/kids"]) {
  assert.ok(androidManifest.includes('android:pathPrefix="' + routePrefix + '"'), "Android App Links must include " + routePrefix);
}
assert.doesNotMatch(
  androidManifest,
  /android:scheme="https"[\s\S]*?android:host="zikrmediaofficial\.vercel\.app"[\s\S]*?android:pathPrefix="\/auth\/callback"/,
  "Android App Links must not intercept the HTTPS OAuth callback",
);
console.log("Native Google OAuth and canonical-host contracts passed.");

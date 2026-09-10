import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "capacitor.config.json",
  "android/app/src/main/AndroidManifest.xml",
  "android/gradle/wrapper/gradle-wrapper.properties",
  "android/app/src/main/java/com/zikr/app/MainActivity.java",
  "android/app/src/main/res/drawable/ic_stat_zikr.xml",
  "android/app/src/main/res/drawable/splash.xml",
  "ios/App/App/Info.plist",
  "ios/App/App/AppDelegate.swift",
  "ios/App/App/App.entitlements",
  "ios/App/App.xcodeproj/project.pbxproj",
  "ios/App/Podfile",
  "android/variables.gradle",
  "mobile/capacitor-dependencies.json",
  "app/.well-known/assetlinks.json/route.ts",
  "app/.well-known/apple-app-site-association/route.ts",
  "components/layout/native-capacitor-bridge.tsx",
  "components/layout/native-google-oauth-handler.tsx",
  "public/sw.js",
  "public/audio/adhan.mp3",
  "public/audio/salawat.wav",
  "android/app/src/main/res/raw/adhan.wav",
  "android/app/src/main/res/raw/salawat.wav",
  "ios/App/App/Resources/adhan.wav",
  "ios/App/App/Resources/salawat.wav",
  "app/manifest.ts",
  "public/offline-content/v1/manifest.json",
  "lib/offline-pack.ts",
];

const failures = [];
const releaseCheck = process.env.MOBILE_RELEASE_CHECK === "1";
const releasePlatform = process.env.MOBILE_RELEASE_PLATFORM || "all";
const releaseChannel = process.env.MOBILE_RELEASE_CHANNEL || "store";

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required mobile/offline file: ${file}`);
}

const read = file => (existsSync(file) ? readFileSync(file, "utf8") : "");
let capacitor = {};
let capacitorDeps = {};
let packageJson = {};
try {
  capacitor = JSON.parse(read("capacitor.config.json") || "{}");
  capacitorDeps = JSON.parse(read("mobile/capacitor-dependencies.json") || "{}");
  packageJson = JSON.parse(read("package.json") || "{}");
} catch (error) {
  failures.push(`Mobile configuration JSON is invalid: ${error instanceof Error ? error.message : "unknown error"}`);
}
const packageDependencies = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };

if (capacitor.appId !== "com.zikr.app") failures.push("Capacitor appId must be com.zikr.app");
if (capacitor.appName !== "ZIKR | ذِكرٌ") failures.push("Capacitor appName must be ZIKR | ذِكرٌ");
if (capacitor.server?.url !== "https://zikrmediaofficial.vercel.app") failures.push("Capacitor server.url must point at the production SSR origin");

for (const dependency of ["@capacitor/core", "@capacitor/android", "@capacitor/ios", "@capacitor/app"]) {
  if (!capacitorDeps.dependencies?.[dependency] && !capacitorDeps.devDependencies?.[dependency]) failures.push(`Mobile dependency manifest missing ${dependency}`);
  if (!packageDependencies[dependency]) failures.push(`package.json is missing installed mobile dependency ${dependency}`);
}
if (!packageDependencies["@capacitor/cli"]) failures.push("package.json is missing @capacitor/cli; native sync cannot run from the repository");
if (capacitorDeps.dependencies?.["@capacitor-community/biometric-auth"]) failures.push("Mobile dependency manifest references the nonexistent @capacitor-community/biometric-auth package");

for (const host of ["*.supabase.co", "accounts.google.com", "api.alquran.cloud", "hadithapi.com"]) {
  if (!capacitor.server?.allowNavigation?.includes(host)) failures.push(`Capacitor allowNavigation missing ${host}`);
}

const androidManifest = read("android/app/src/main/AndroidManifest.xml");
for (const token of [
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.CAMERA",
  "android.permission.RECORD_AUDIO",
  'android:autoVerify="true"',
  'android:host="zikrmediaofficial.vercel.app"',
  'android:scheme="com.zikr.app"',
  'android:supportsRtl="true"',
]) {
  if (!androidManifest.includes(token)) failures.push(`Android manifest missing ${token}`);
}

const plist = read("ios/App/App/Info.plist");
for (const token of [
  "<string>com.zikr.app</string>",
  "<key>NSCameraUsageDescription</key>",
  "<key>NSMicrophoneUsageDescription</key>",
  "<key>NSFaceIDUsageDescription</key>",
  "<string>audio</string>",
  "<string>remote-notification</string>",
  "<key>WKAppBoundDomains</key>",
]) {
  if (!plist.includes(token)) failures.push(`iOS Info.plist missing ${token}`);
}

const entitlements = read("ios/App/App/App.entitlements");
if (!entitlements.includes("applinks:zikrmediaofficial.vercel.app")) failures.push("iOS entitlements missing production associated domain");

const pbxproj = read("ios/App/App.xcodeproj/project.pbxproj");
for (const token of ["adhan.wav in Resources", "salawat.wav in Resources", "CODE_SIGN_ENTITLEMENTS = App/App.entitlements;"]) {
  if (!pbxproj.includes(token)) failures.push(`iOS Xcode project missing ${token}`);
}

const bridge = read("components/layout/native-capacitor-bridge.tsx");
for (const token of ["zikrNative", "networkStatusChange", "Share", "Camera", "Filesystem", "Haptics", "scheduleLocalNotification", "cancelLocalNotifications"]) {
  if (!bridge.includes(token)) failures.push(`Native bridge missing ${token}`);
}

const nativeOAuth = read("components/layout/native-google-oauth-handler.tsx");
for (const token of ["Capacitor.isNativePlatform", "appUrlOpen", "getLaunchUrl", "exchangeCodeForSession", "com.zikr.app:", "/callback"]) {
  if (!nativeOAuth.includes(token)) failures.push(`Native Google OAuth handler missing ${token}`);
}
if (bridge.includes('parsed.protocol === "com.zikr.app:"') && bridge.includes("exchangeCodeForSession")) {
  failures.push("Native bridge must not exchange the Google OAuth session; NativeGoogleOAuthHandler is the single callback owner");
}

const loader = read("components/layout/native-capacitor-bridge-loader.tsx");
if (!loader.includes("NativeGoogleOAuthHandler")) failures.push("Native bridge loader must mount NativeGoogleOAuthHandler");

const offlineManifestPath = "public/offline-content/v1/manifest.json";
try {
  const manifest = JSON.parse(read(offlineManifestPath));
  if (!manifest.version || !manifest.generatedAt) failures.push("Offline manifest is missing version/generatedAt");
  if (!manifest.datasets || typeof manifest.datasets !== "object") failures.push("Offline manifest has no datasets map");
  if (!Array.isArray(manifest.routes) || manifest.routes.length < 20) failures.push("Offline manifest must contain the public route inventory");
  for (const [dataset, definition] of Object.entries(manifest.datasets || {})) {
    if (!definition?.path || !definition?.count) { failures.push(`Offline dataset ${dataset} is missing path/count metadata`); continue; }
    if (!definition.path.startsWith("/offline-content/")) { failures.push(`Offline dataset ${dataset} path is outside /offline-content/`); continue; }
    const localPath = definition.path.replace(/^\//, "");
    if (!existsSync(`public/${localPath}`)) failures.push(`Offline dataset file missing: public/${localPath}`);
  }
} catch (error) {
  failures.push(`Offline manifest is invalid JSON: ${error instanceof Error ? error.message : "unknown error"}`);
}

const offlinePack = read("lib/offline-pack.ts");
for (const token of ["offline_manifest", "requestOfflineRouteCache", "cacheRoutes?: boolean", "offline-content-version-v4"]) {
  if (!offlinePack.includes(token)) failures.push(`Offline pack is missing ${token}`);
}

const serviceWorker = read("public/sw.js");
for (const token of ['CACHE_NAME = "zikr-v12"', "OFFLINE_CONTENT_PREFIX", "CACHE_OFFLINE_ROUTES", "cacheReferencedStaticAssets"]) {
  if (!serviceWorker.includes(token)) failures.push(`Service worker missing ${token}`);
}

if (serviceWorker.includes('if (request.headers.get("accept")?.includes("text/html"))') && serviceWorker.includes('cache.put(request, response.clone())')) {
  const htmlHandlerStart = serviceWorker.indexOf('if (request.headers.get("accept")?.includes("text/html"))');
  const htmlHandlerEnd = serviceWorker.indexOf('\n  event.respondWith(', htmlHandlerStart + 10);
  const htmlHandler = serviceWorker.slice(htmlHandlerStart, htmlHandlerEnd === -1 ? htmlHandlerStart + 2500 : htmlHandlerEnd);
  if (htmlHandler.includes('cache.put(request, response.clone())')) {
    failures.push("Service worker must not cache generic HTML responses");
  }
}
if (serviceWorker.match(/const CORE_INSTALL_ASSETS = \[([\s\S]*?)\];/)) {
  const coreAssets = serviceWorker.match(/const CORE_INSTALL_ASSETS = \[([\s\S]*?)\];/)[1];
  if (coreAssets.includes('"/"')) failures.push("Service worker must not pre-cache the root HTML route");
}

if (releaseCheck && releaseChannel === "store" && ["all", "android"].includes(releasePlatform) && !process.env.ANDROID_APP_LINKS_SHA256) failures.push("ANDROID_APP_LINKS_SHA256 is required for a Play Store release; provide the real release signing certificate SHA-256 fingerprint.");
if (releaseCheck && releaseChannel === "store" && ["all", "ios"].includes(releasePlatform) && !process.env.IOS_ASSOCIATED_DOMAIN_APP_ID) failures.push("IOS_ASSOCIATED_DOMAIN_APP_ID is required for an App Store release; provide the real Apple Team ID and bundle ID.");
if (releaseCheck && !["all", "android", "ios"].includes(releasePlatform)) failures.push("MOBILE_RELEASE_PLATFORM must be one of: all, android, ios.");

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log("✅ Mobile readiness, offline pack, and native OAuth checks passed");

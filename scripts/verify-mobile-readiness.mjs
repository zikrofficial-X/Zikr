import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "capacitor.config.json",
  "android/app/src/main/AndroidManifest.xml",
  "android/gradlew",
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
  "public/sw.js",
  "public/audio/adhan.mp3",
  "public/audio/salawat.wav",
  "android/app/src/main/res/raw/adhan.wav",
  "android/app/src/main/res/raw/salawat.wav",
  "ios/App/App/Resources/adhan.wav",
  "ios/App/App/Resources/salawat.wav",
  "app/manifest.ts",
];

const failures = [];
const releaseCheck = process.env.MOBILE_RELEASE_CHECK === "1";

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required mobile file: ${file}`);
}

const read = file => (existsSync(file) ? readFileSync(file, "utf8") : "");
const capacitor = JSON.parse(read("capacitor.config.json"));
const capacitorDeps = JSON.parse(
  read("mobile/capacitor-dependencies.json") || "{}"
);
const packageJson = JSON.parse(read("package.json"));
const packageDependencies = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
};

if (capacitor.appId !== "com.zikr.app")
  failures.push("Capacitor appId must be com.zikr.app");
if (capacitor.appName !== "ZIKR | ذِكرٌ")
  failures.push("Capacitor appName must be ZIKR | ذِكرٌ");
if (capacitor.server?.url !== "https://zikrmediaofficial.vercel.app") {
  failures.push("Capacitor server.url must point at the production SSR origin");
}

for (const dependency of [
  "@capacitor/core",
  "@capacitor/android",
  "@capacitor/ios",
  "@capacitor/app",
]) {
  if (
    !capacitorDeps.dependencies?.[dependency] &&
    !capacitorDeps.devDependencies?.[dependency]
  ) {
    failures.push(`Mobile dependency manifest missing ${dependency}`);
  }
  if (!packageDependencies[dependency]) {
    failures.push(
      `package.json is missing installed mobile dependency ${dependency}`
    );
  }
}
if (!packageDependencies["@capacitor/cli"]) {
  failures.push(
    "package.json is missing @capacitor/cli; native sync cannot run from the repository"
  );
}
if (capacitorDeps.dependencies?.["@capacitor-community/biometric-auth"]) {
  failures.push(
    "Mobile dependency manifest references the nonexistent @capacitor-community/biometric-auth package"
  );
}

for (const host of [
  "*.supabase.co",
  "accounts.google.com",
  "api.alquran.cloud",
  "hadithapi.com",
]) {
  if (!capacitor.server?.allowNavigation?.includes(host)) {
    failures.push(`Capacitor allowNavigation missing ${host}`);
  }
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
  if (!androidManifest.includes(token))
    failures.push(`Android manifest missing ${token}`);
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
if (!entitlements.includes("applinks:zikrmediaofficial.vercel.app")) {
  failures.push("iOS entitlements missing production associated domain");
}

const pbxproj = read("ios/App/App.xcodeproj/project.pbxproj");
for (const token of [
  "adhan.wav in Resources",
  "salawat.wav in Resources",
  "CODE_SIGN_ENTITLEMENTS = App/App.entitlements;",
]) {
  if (!pbxproj.includes(token))
    failures.push(`iOS Xcode project missing ${token}`);
}

const bridge = read("components/layout/native-capacitor-bridge.tsx");
for (const token of [
  "zikrNative",
  "appUrlOpen",
  "networkStatusChange",
  "Share",
  "Camera",
  "Filesystem",
  "Haptics",
  "scheduleLocalNotification",
  "cancelLocalNotifications",
  "createChannel",
]) {
  if (!bridge.includes(token)) failures.push(`Native bridge missing ${token}`);
}

if (releaseCheck && !process.env.ANDROID_APP_LINKS_SHA256) {
  failures.push(
    "ANDROID_APP_LINKS_SHA256 is required for a Play Store release; provide the real release signing certificate SHA-256 fingerprint."
  );
}
if (releaseCheck && !process.env.IOS_ASSOCIATED_DOMAIN_APP_ID) {
  failures.push(
    "IOS_ASSOCIATED_DOMAIN_APP_ID is required for an App Store release; provide the real Apple Team ID and bundle ID."
  );
}

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log("✅ Mobile readiness configuration checks passed");

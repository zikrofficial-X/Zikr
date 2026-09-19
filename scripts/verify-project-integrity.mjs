import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];

function read(path) {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    failures.push(`Cannot read required file: ${path}`);
    return '';
  }
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`Missing required file: ${path}`);
}

function requireText(path, tokens) {
  const content = read(path);
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${path} is missing required token: ${token}`);
  }
}

const requiredFiles = [
  'package.json',
  'pnpm-lock.yaml',
  'next.config.ts',
  'proxy.ts',
  'src/app/layout.tsx',
  'src/app/manifest.ts',
  'public/sw.js',
  'public/offline.html',
  'public/offline-content/v1/manifest.json',
  'src/lib/offline-db.ts',
  'src/lib/offline-pack.ts',
  'src/lib/offline-settings.ts',
  'src/features/offline/hooks/use-offline-status.ts',
  'src/features/offline/hooks/use-offline-data.ts',
  'src/components/layout/service-worker-register.tsx',
  'src/components/layout/offline-navigation-guard.tsx',
  'src/components/layout/native-capacitor-bridge.tsx',
  'src/app/settings/page.tsx',
  'scripts/verify-platform-routes.mjs',
  'scripts/verify-mobile-readiness.mjs',
  'scripts/verify-offline-content.mjs',
  'android/app/src/main/AndroidManifest.xml',
  'ios/App/App/Info.plist',
  'capacitor.config.json',
  '.release-tag',
  'PACKAGE_VERSION.txt',
];
for (const file of requiredFiles) requireFile(file);

const packageJson = JSON.parse(read('package.json') || '{}');
if (packageJson.packageManager !== 'pnpm@9.15.0') failures.push('package.json must pin pnpm@9.15.0');
if (!String(packageJson.engines?.node || '').includes('22')) failures.push('package.json must require Node 22 compatibility');
if (existsSync(join(root, 'package-lock.json'))) failures.push('package-lock.json must not coexist with pnpm-lock.yaml');
if (existsSync(join(root, 'yarn.lock'))) failures.push('yarn.lock must not coexist with pnpm-lock.yaml');
if (!packageJson.scripts?.verify?.includes('offline:check')) failures.push('pnpm verify must include offline:check');
if (!packageJson.scripts?.verify?.includes('project:check')) failures.push('pnpm verify must include project:check');

const packageVersion = String(packageJson.version || '');
const releaseTag = read('.release-tag').trim();
const packageVersionFile = read('PACKAGE_VERSION.txt');
const packageVersionMatch = packageVersionFile.match(/^ZIKR\s+v([^\n\r]+)\s*$/m);
const packageVersionCodeMatch = packageVersionFile.match(/^versionCode=(\d+)\s*$/m);
const packageApplicationIdMatch = packageVersionFile.match(/^applicationId=([^\n\r]+)\s*$/m);
const androidBuild = read('android/app/build.gradle');
const androidVersionNameMatch = androidBuild.match(/versionName\s+"([^"]+)"/);
const androidVersionCodeMatch = androidBuild.match(/versionCode\s+(\d+)/);
const androidApplicationIdMatch = androidBuild.match(/applicationId\s+"([^"]+)"/);
const androidTargetSdkMatch = androidBuild.match(/targetSdkVersion\s+rootProject\.ext\.targetSdkVersion/);
const androidVariables = read('android/variables.gradle');
const iosProject = read('ios/App/App.xcodeproj/project.pbxproj');
const iosInfoPlist = read('ios/App/App/Info.plist');
const iosMarketingVersions = [...iosProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
const iosProjectVersions = [...iosProject.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
const iosShortVersion = iosInfoPlist.match(/<key>CFBundleShortVersionString<\\/key>\\s*<string>([^<]+)<\\/string>/)?.[1];
const iosBundleVersion = iosInfoPlist.match(/<key>CFBundleVersion<\\/key>\\s*<string>([^<]+)<\\/string>/)?.[1];

const androidTargetSdkValueMatch = androidVariables.match(/targetSdkVersion\s*=\s*(\d+)/);

if (!packageVersion || !/^\d+\.\d+\.\d+$/.test(packageVersion)) failures.push('package.json version must be a semantic release version');
if (releaseTag !== `v${packageVersion}`) failures.push(`.release-tag must match package.json version (expected v${packageVersion})`);
if (packageVersionMatch?.[1] !== packageVersion) failures.push(`PACKAGE_VERSION.txt version must match package.json (${packageVersion})`);
if (androidVersionNameMatch?.[1] !== packageVersion) failures.push(`android/app/build.gradle versionName must match package.json (${packageVersion})`);
if (androidVersionCodeMatch && packageVersionCodeMatch && androidVersionCodeMatch[1] !== packageVersionCodeMatch[1]) failures.push('PACKAGE_VERSION.txt versionCode must match android/app/build.gradle');
if (androidApplicationIdMatch && packageApplicationIdMatch && androidApplicationIdMatch[1] !== packageApplicationIdMatch[1]) failures.push('PACKAGE_VERSION.txt applicationId must match android/app/build.gradle');
if (!androidTargetSdkMatch || androidTargetSdkValueMatch?.[1] !== packageVersionFile.match(/^targetSdk=(\d+)\s*$/m)?.[1]) failures.push('PACKAGE_VERSION.txt targetSdk must match android/variables.gradle');

const capacitorConfig = JSON.parse(read('capacitor.config.json') || '{}');
if (capacitorConfig.plugins?.BiometricAuth) failures.push('capacitor.config.json contains an orphan BiometricAuth plugin configuration without a matching installed dependency');

const mobileDependencyManifest = JSON.parse(read('mobile/capacitor-dependencies.json') || '{}');
const expectedMobileDeps = {
  ...Object.fromEntries(Object.entries(packageJson.dependencies || {}).filter(([name]) => name.startsWith('@capacitor/') || name.startsWith('@capawesome/'))),
  ...Object.fromEntries(Object.entries(packageJson.devDependencies || {}).filter(([name]) => name === '@capacitor/cli')),
};
const declaredMobileDeps = { ...(mobileDependencyManifest.dependencies || {}), ...(mobileDependencyManifest.devDependencies || {}) };
for (const [name, version] of Object.entries(expectedMobileDeps)) {
  if (declaredMobileDeps[name] !== version) failures.push(`mobile/capacitor-dependencies.json drift: ${name} must be ${version}`);
}
for (const name of Object.keys(declaredMobileDeps)) {
  if (!expectedMobileDeps[name]) failures.push(`mobile/capacitor-dependencies.json contains uninstalled dependency: ${name}`);
}

const offlineManifest = JSON.parse(read('public/offline-content/v1/manifest.json') || '{}');
const expectedDatasets = {
  surahs: 'surahs',
  ayahs: 'ayahs',
  tafsir: 'tafsir',
  hadith_books: 'hadithBooks',
  hadith: 'hadith',
  prophets: 'prophets',
  prophet_sections: 'prophetSections',
  battles: 'battles',
  battle_events: 'battleEvents',
  conquests: 'conquests',
  conquest_events: 'conquestEvents',
  articles: 'articles',
  duas: 'duas',
  kids: 'kids',
  companions: 'companions',
  companion_stories: 'companionStories',
};
const offlineDbSource = read('src/lib/offline-db.ts');
const offlinePackSource = read('src/lib/offline-pack.ts');
for (const [dataset, store] of Object.entries(expectedDatasets)) {
  if (!offlineManifest.datasets?.[dataset]) failures.push(`Offline manifest missing dataset: ${dataset}`);
  if (!offlinePackSource.includes(`${dataset}: '${store}'`) && !offlinePackSource.includes(`${dataset}: "${store}"`)) failures.push(`Offline pack mapping missing ${dataset} -> ${store}`);
  if (!offlineDbSource.includes(`name: '${store}'`) && !offlineDbSource.includes(`name: "${store}"`)) failures.push(`IndexedDB store missing: ${store}`);
}
if (!Array.isArray(offlineManifest.routes) || offlineManifest.routes.length === 0) failures.push('Offline manifest has no routes');
for (const route of offlineManifest.routes || []) {
  if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//')) {
    failures.push(`Invalid offline route: ${route}`);
    continue;
  }
  if (/^\/(admin|profile|favorites)(\/|$)/.test(route)) failures.push(`Private route must not be in offline manifest: ${route}`);
}

requireText('public/sw.js', [
  'const CACHE_NAME = "zikr-v12"',
  'CACHE_OFFLINE_ROUTES',
  'OFFLINE_CONTENT_PREFIX',
  'pathname.startsWith("/api/")',
  'pathname.startsWith("/admin")',
]);
const serviceWorker = read('public/sw.js');
const htmlHandlerStart = serviceWorker.indexOf('if (request.headers.get("accept")?.includes("text/html"))');
if (htmlHandlerStart !== -1) {
  const htmlHandlerEnd = serviceWorker.indexOf("\n  event.respondWith(", htmlHandlerStart + 10);
  const htmlHandler = serviceWorker.slice(htmlHandlerStart, htmlHandlerEnd === -1 ? serviceWorker.length : htmlHandlerEnd);
  if (htmlHandler.includes('cache.put(request, response.clone())')) failures.push('public/sw.js must not cache generic HTML responses');
}
const coreMatch = serviceWorker.match(/const CORE_INSTALL_ASSETS = \[([\s\S]*?)\];/);
if (coreMatch?.[1].includes('"/"')) failures.push('public/sw.js must not pre-cache the root HTML route');
if (serviceWorker.includes('const CACHE_NAME = "zikr-v10"')) failures.push('public/sw.js must not retain legacy cache version zikr-v10');

requireText('src/components/layout/offline-navigation-guard.tsx', [
  'navigator.onLine',
  'event.stopImmediatePropagation()',
  'window.location.assign',
]);
requireText('src/lib/offline-pack.ts', [
  'verifyCompletedDatasets',
  'COMPLETION_DB_KEY',
  'requestOfflineRouteCache',
  'failedRoutes',
]);
requireText('src/lib/offline-db.ts', [
  'initializing: Promise<void> | null',
  'onversionchange',
  'async count(',
]);
requireText('src/components/layout/service-worker-register.tsx', [
  "navigator.serviceWorker.register('/sw.js'",
  'hydrateOfflineContent',
]);
requireText('src/app/layout.tsx', ['OfflineNavigationGuard']);
requireText('src/app/manifest.ts', ['short_name', 'icons']);

const mobileBridge = read('src/components/layout/native-capacitor-bridge.tsx');
for (const token of [
  'zikrNative',
  'scheduleLocalNotification',
  'cancelLocalNotifications',
  'networkStatusChange',
  'Filesystem',
  'Haptics',
]) {
  if (!mobileBridge.includes(token)) warnings.push(`Native bridge token not found: ${token}`);
}

if (capacitorConfig.appId !== 'com.zikr.app') failures.push('Capacitor appId drift detected');
if (capacitorConfig.server?.url !== 'https://zikrmediaofficial.vercel.app') failures.push('Capacitor server URL drift detected');

const androidManifest = read('android/app/src/main/AndroidManifest.xml');
for (const token of [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.ACCESS_FINE_LOCATION',
  'android:supportsRtl="true"',
]) {
  if (!androidManifest.includes(token)) warnings.push(`Android manifest missing: ${token}`);
}

const plist = read('ios/App/App/Info.plist');
for (const token of ['NSCameraUsageDescription', 'NSMicrophoneUsageDescription', 'remote-notification']) {
  if (!plist.includes(token)) warnings.push(`iOS Info.plist missing: ${token}`);
}

const nextConfig = read('next.config.ts');
const siteSource = read('src/lib/site.ts');
if (!nextConfig.includes('NEXT_PUBLIC_SITE_URL')) {
  failures.push('next.config.ts must expose NEXT_PUBLIC_SITE_URL from the canonical production source');
}
if (
  !siteSource.includes('PRODUCTION_URL') ||
  !siteSource.includes('export const PRODUCTION_URL = "https://zikrmediaofficial.vercel.app";') ||
  !siteSource.includes('url: PRODUCTION_URL')
) {
  failures.push('src/lib/site.ts must remain the immutable canonical site URL source');
}
if (!nextConfig.includes('https://ep1.adtrafficquality.google')) {
  warnings.push('CSP does not explicitly mention ep1.adtrafficquality.google; verify against current AdSense traffic tooling.');
}

const secretPattern = /(sk-[A-Za-z0-9]{20,}|service[_-]?role[^\n]{0,40}[:=]\s*["'][A-Za-z0-9._-]{20,}["']|-----BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY-----)/i;
const ignoredDirs = new Set(['node_modules', '.next', '.git', 'android/.gradle', 'ios/App/Pods']);
function walk(dir) {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    const rel = relative(root, path).replaceAll('\\', '/');
    if (ignoredDirs.has(rel) || [...ignoredDirs].some(d => rel.startsWith(`${d}/`))) continue;
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && /\.(?:ts|tsx|js|mjs|json|yml|yaml|md|xml|plist|java|swift|properties)$/i.test(entry.name)) {
      try {
        const text = readFileSync(path, 'utf8');
        if (secretPattern.test(text) && !rel.endsWith('.env.example')) failures.push(`Possible secret literal detected in ${rel}`);
      } catch {}
    }
  }
}
walk(root);

if (failures.length) {
  console.error(`❌ Project integrity audit failed with ${failures.length} failure(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn(`⚠️ Project integrity audit completed with ${warnings.length} warning(s):`);
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

console.log(`✅ Project integrity audit passed (${offlineManifest.routes?.length ?? 0} offline routes, ${Object.keys(offlineManifest.datasets || {}).length} datasets checked)`);
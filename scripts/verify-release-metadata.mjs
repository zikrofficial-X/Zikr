#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : "");
const fail = (message) => failures.push(message);

const packageJson = (() => {
  try {
    return JSON.parse(read("package.json") || "{}");
  } catch (error) {
    fail(`package.json is not valid JSON: ${error instanceof Error ? error.message : "unknown error"}`);
    return {};
  }
})();

const version = String(packageJson.version || "");
const releaseTag = process.env.RELEASE_TAG || read(".release-tag").trim();
const packageVersionText = read("PACKAGE_VERSION.txt");
const androidBuild = read("android/app/build.gradle");
const iosProject = read("ios/App/App.xcodeproj/project.pbxproj");
const iosInfoPlist = read("ios/App/App/Info.plist");

const iosMarketingVersions = [...iosProject.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
const iosProjectVersions = [...iosProject.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map((match) => match[1].trim());
const iosShortVersion = iosInfoPlist.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
const iosBundleVersion = iosInfoPlist.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/)?.[1];

const androidVariables = read("android/variables.gradle");

if (!/^\d+\.\d+\.\d+$/.test(version)) fail("package.json version must be a semantic release version");
if (releaseTag !== `v${version}`) fail(`release tag must be v${version}`);

const packageVersion = packageVersionText.match(/^ZIKR\s+v([^\r\n]+)\s*$/m)?.[1];
const packageCode = packageVersionText.match(/^versionCode=(\d+)\s*$/m)?.[1];
const packageAppId = packageVersionText.match(/^applicationId=([^\r\n]+)\s*$/m)?.[1];
const packageTargetSdk = packageVersionText.match(/^targetSdk=(\d+)\s*$/m)?.[1];
const androidVersion = androidBuild.match(/versionName\s+"([^"]+)"/)?.[1];
const androidCode = androidBuild.match(/versionCode\s+(\d+)/)?.[1];
const androidAppId = androidBuild.match(/applicationId\s+"([^"]+)"/)?.[1];
const androidTargetSdk = androidVariables.match(/targetSdkVersion\s*=\s*(\d+)/)?.[1];

if (packageVersion !== version) fail(`PACKAGE_VERSION.txt version must be ${version}`);
if (androidVersion !== version) fail(`android/app/build.gradle versionName must be ${version}`);
if (!packageCode || !androidCode) fail("Android versionCode metadata is missing");
if (packageCode !== androidCode) fail("versionCode mismatch between PACKAGE_VERSION.txt and Android build.gradle");
if (!packageAppId || !androidAppId) fail("applicationId metadata is missing");
if (packageAppId !== androidAppId) fail("applicationId mismatch between PACKAGE_VERSION.txt and Android build.gradle");
if (!packageTargetSdk || !androidTargetSdk) fail("targetSdk metadata is missing");
if (packageTargetSdk !== androidTargetSdk) fail("targetSdk mismatch between PACKAGE_VERSION.txt and android/variables.gradle");

if (packageAppId !== "com.zikr.app") fail("applicationId must remain com.zikr.app");
if (packageTargetSdk !== "36") fail("targetSdk must remain 36 for the current release baseline");

if (!iosMarketingVersions.length || iosMarketingVersions.some((value) => value !== version)) {
  fail(`iOS MARKETING_VERSION must match package.json version ${version}`);
}
if (!iosProjectVersions.length || iosProjectVersions.some((value) => value !== packageCode)) {
  fail(`iOS CURRENT_PROJECT_VERSION must match versionCode ${packageCode}`);
}
if (iosShortVersion !== version) fail(`iOS CFBundleShortVersionString must be ${version}`);
if (iosBundleVersion !== packageCode) fail(`iOS CFBundleVersion must be ${packageCode}`);

const capacitor = (() => {
  try {
    return JSON.parse(read("capacitor.config.json") || "{}");
  } catch {
    fail("capacitor.config.json is not valid JSON");
    return {};
  }
})();
if (capacitor.appId !== "com.zikr.app") fail("capacitor.config.json appId must be com.zikr.app");
if (capacitor.server?.url !== "https://zikrmediaofficial.vercel.app") fail("capacitor.config.json server.url must match the canonical production origin");

if (failures.length) {
  console.error("RELEASE_METADATA_VALIDATION_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log(`✅ Release metadata aligned: v${version}, code ${packageCode}, target SDK ${packageTargetSdk}, app ${packageAppId}`);

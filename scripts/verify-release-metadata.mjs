import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
const version = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
const code = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
const releaseTag = process.env.RELEASE_TAG || '';

if (!version || !Number.isInteger(code) || code <= 0) {
  throw new Error('Android release metadata is missing or invalid');
}
if (!pkg.version) throw new Error('package.json version is missing');
if (pkg.version !== version) throw new Error(`package.json ${pkg.version} != Android ${version}`);
if (releaseTag && releaseTag !== `v${version}`) {
  throw new Error(`Release tag ${releaseTag} != Android version v${version}`);
}

console.log(`Release metadata OK: ${version} (${code})${releaseTag ? ` [${releaseTag}]` : ''}`);

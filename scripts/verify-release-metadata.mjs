import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
const version = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
const code = gradle.match(/versionCode\s+(\d+)/)?.[1];
if (!version || !code) throw new Error('Android release metadata is missing');
if (pkg.version !== version) throw new Error(`package.json ${pkg.version} != Android ${version}`);
if (version !== '1.4.4' || code !== '35') throw new Error(`Unexpected release ${version}/${code}`);
console.log(`Release metadata OK: ${version} (${code})`);

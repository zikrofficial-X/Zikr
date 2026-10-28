import assert from "node:assert/strict";
import { resolveAndroidApkDownloadUrl } from "../../src/features/releases/android-download-url";

const productionOrigin = "https://zikrmediaofficial.vercel.app";

assert.equal(
  resolveAndroidApkDownloadUrl("/api/download/android", productionOrigin),
  "https://zikrmediaofficial.vercel.app/api/download/android",
  "the native browser must receive an absolute APK URL",
);

assert.equal(
  resolveAndroidApkDownloadUrl(
    "https://zikrmediaofficial.vercel.app/api/download/android",
    productionOrigin,
  ),
  "https://zikrmediaofficial.vercel.app/api/download/android",
  "an absolute same-origin download URL remains valid",
);

assert.equal(
  resolveAndroidApkDownloadUrl(
    "/api/download/android?source=update",
    productionOrigin,
  ),
  "https://zikrmediaofficial.vercel.app/api/download/android?source=update",
  "safe query parameters may be preserved",
);

assert.throws(
  () => resolveAndroidApkDownloadUrl("//attacker.example/api/download/android", productionOrigin),
  /app origin/i,
  "cross-origin APK URLs must be rejected",
);

assert.throws(
  () => resolveAndroidApkDownloadUrl("/api/app-version", productionOrigin),
  /download path/i,
  "only the official APK download endpoint may be opened",
);

assert.throws(
  () => resolveAndroidApkDownloadUrl("http://zikrmediaofficial.vercel.app/api/download/android", productionOrigin),
  /app origin/i,
  "insecure alternate-origin protocol must be rejected",
);

assert.equal(
  resolveAndroidApkDownloadUrl("/api/download/android", "http://localhost:3000"),
  "http://localhost:3000/api/download/android",
  "local development over localhost remains supported",
);

console.log("Android update download URL contract checks passed.");

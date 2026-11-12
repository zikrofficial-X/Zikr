import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getServiceWorkerScriptUrl } from "../../src/lib/ads/runtime-policy";
import { PRODUCTION_URL } from "../../src/lib/site";

const productionHost = new URL(PRODUCTION_URL).hostname;

assert.equal(productionHost, "zikrmediaofficial.vercel.app");
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: true,
    hostname: productionHost,
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js?native=1",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    hostname: productionHost,
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js?monetag=1",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    hostname: "zikr-git-preview.vercel.app",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    hostname: "zikrmediaofficial.vercel.app.evil",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
);
assert.equal(
  getServiceWorkerScriptUrl({
    isNative: false,
    hostname: "localhost",
    productionUrl: PRODUCTION_URL,
  }),
  "/sw.js",
);

const worker = readFileSync("public/sw.js", "utf8");
assert.ok(worker.includes('searchParams.get("native") === "1"'));
assert.ok(worker.includes('searchParams.get("monetag") === "1"'));
assert.ok(
  worker.includes('hostname.toLowerCase() === "zikrmediaofficial.vercel.app"'),
);
const guardIndex = worker.indexOf("if (isCanonicalMonetagWorker)");
const importIndex = worker.indexOf(
  "importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')",
);
const importTryIndex = worker.lastIndexOf("try {", importIndex);
const importCatchIndex = worker.indexOf("} catch", importIndex);
assert.ok(guardIndex >= 0 && guardIndex < importIndex);
assert.ok(importTryIndex >= 0 && importTryIndex < importIndex);
assert.ok(importCatchIndex > importIndex);
assert.ok(worker.includes("if (isCanonicalMonetagWorker) return;"));
assert.ok(worker.includes("await purgeDisabledAdvertisingMarkup()"));

console.log("Service-worker advertising scope contract passed.");

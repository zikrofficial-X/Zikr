import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const failures = [];

function requireCondition(condition, message) {
  if (!condition) failures.push(message);
}

const layout = read("src/app/layout.tsx");
const advertisingRuntime = read(
  "src/components/layout/web-advertising-runtime.tsx",
);
const footer = read("src/components/layout/footer.tsx");
const smartLinkPromo = read("src/components/smartlink-promo.tsx");
const serviceWorkerRegister = read(
  "src/components/layout/service-worker-register.tsx",
);
const runtimePolicy = read("src/lib/ads/runtime-policy.ts");
const serviceWorker = read("public/sw.js");
const offlineAudio = read("src/features/quran/services/offline-audio.ts");
const offlinePack = read("src/lib/offline-pack.ts");
const adsenseSlot = read("src/components/layout/adsense-slot.tsx");
const runtimeEffects = read("src/components/layout/runtime-effects.tsx");
const deferredRuntime = read("src/components/layout/deferred-runtime.tsx");

requireCondition(
  layout.includes("<WebAdvertisingRuntime />"),
  "The root layout must mount the environment-aware advertising runtime.",
);
requireCondition(
  !/al5sm\.com|5gvci\.com|name="monetag"|name="google-adsense-account"|google-consent-mode-default|window\.adsbygoogle|requestNonPersonalizedAds|fundingchoicesmessages\.google\.com|googletagmanager\.com\/gtm\.js/.test(
    layout,
  ),
  "The root layout must not emit advertising scripts or verification markup into native HTML.",
);
requireCondition(
  advertisingRuntime.includes("if (Capacitor.isNativePlatform()) {\n      removeAdvertisingElements();\n      return;\n    }") &&
    advertisingRuntime.indexOf("if (Capacitor.isNativePlatform())") <
      advertisingRuntime.indexOf("if (process.env.NODE_ENV !== \"production\")"),
  "The advertising runtime must exit on native before creating any third-party script.",
);
for (const host of ["al5sm.com", "5gvci.com", "uplcm.com"]) {
  requireCondition(
    advertisingRuntime.includes(host),
    `The native advertising cleanup must explicitly cover ${host}.`,
  );
}
requireCondition(
  footer.includes("showSmartLink && isWebRuntime"),
  "The shared footer SmartLink placement must render only on the website.",
);
requireCondition(
  smartLinkPromo.includes("Capacitor.isNativePlatform()") &&
    smartLinkPromo.includes("if (!isWebRuntime) return null"),
  "Standalone SmartLink promotional sections must stay hidden in native shells.",
);
requireCondition(
  serviceWorkerRegister.includes("getServiceWorkerScriptUrl") &&
    serviceWorkerRegister.includes("PRODUCTION_URL") &&
    serviceWorkerRegister.includes("window.location.origin") &&
    runtimePolicy.includes('return "/sw.js?native=1"') &&
    runtimePolicy.includes('return "/sw.js?monetag=1"') &&
    runtimePolicy.includes('return "/sw.js"') &&
    runtimePolicy.includes("currentUrl.origin === productionUrl.origin"),
  "Native, canonical production, and preview workers must use distinct script URLs.",
);
const monetagImportIndex = serviceWorker.indexOf(
  "importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')",
);
const monetagImportTryIndex = serviceWorker.lastIndexOf("try {", monetagImportIndex);
const monetagImportCatchIndex = serviceWorker.indexOf("} catch", monetagImportIndex);
requireCondition(
  serviceWorker.includes('searchParams.get("native") === "1"') &&
    serviceWorker.includes('searchParams.get("monetag") === "1"') &&
    serviceWorker.includes('serviceWorkerLocation.origin === "https://zikrmediaofficial.vercel.app"') &&
    serviceWorker.includes("if (isCanonicalMonetagWorker)") &&
    monetagImportTryIndex >= 0 &&
    monetagImportTryIndex < monetagImportIndex &&
    monetagImportCatchIndex > monetagImportIndex,
  "Monetag service-worker import must be canonical-production-only and non-fatal when the third party is unavailable.",
);
requireCondition(
  serviceWorker.includes("async function purgeDisabledAdvertisingMarkup()") &&
    serviceWorker.includes("await purgeDisabledAdvertisingMarkup()"),
  "The native worker must remove cached HTML containing previously published ad markup.",
);
const appShellCachePattern = /^zikr-v\d+$/;
const appShellCacheName = serviceWorker.match(/const CACHE_NAME = ["']([^"']+)["']/)?.[1] ?? "";
const offlinePackCacheName = offlinePack.match(/const OFFLINE_CACHE_NAME = ["']([^"']+)["']/)?.[1] ?? "";
const quranAudioCacheName = offlineAudio.match(/const CACHE_NAME = ["']([^"']+)["']/)?.[1] ?? "";
requireCondition(
  serviceWorker.includes("const APP_SHELL_CACHE_PATTERN = /^zikr-v\\d+$/;") &&
    serviceWorker.includes("APP_SHELL_CACHE_PATTERN.test(cacheName)") &&
    !serviceWorker.includes("cacheName.startsWith(CACHE_PREFIX)"),
  "Service-worker updates must delete only versioned app-shell caches, never every cache with the zikr- prefix.",
);
requireCondition(
  appShellCachePattern.test(appShellCacheName) &&
    appShellCachePattern.test(offlinePackCacheName),
  "The versioned service-worker and offline-pack caches must match the app-shell cache pattern.",
);
requireCondition(
  quranAudioCacheName === "zikr-quran-audio-v1" &&
    !appShellCachePattern.test(quranAudioCacheName),
  "The persistent Quran audio cache must remain outside app-shell cache cleanup.",
);
for (const providerMarker of [
  "fundingchoicesmessages",
  "googletagmanager",
  "pagead2",
  "googleads",
  "tpc\\.googlesyndication",
  "google-adsense-account",
  "adsbygoogle",
]) {
  requireCondition(
    serviceWorker.includes(providerMarker),
    `The native worker must purge cached HTML containing legacy ${providerMarker} markup.`,
  );
}

const nativeGuardIndex = advertisingRuntime.indexOf("if (Capacitor.isNativePlatform())");
const canonicalOriginGuardIndex = advertisingRuntime.indexOf("if (!isCanonicalProductionOrigin())");
const consentDefaultsIndex = advertisingRuntime.indexOf("installConsentModeDefaults();");
requireCondition(
  !layout.includes("window.adsbygoogle") &&
    !layout.includes('name="google-adsense-account"') &&
    !layout.includes("google-consent-mode-default") &&
    !layout.includes("requestNonPersonalizedAds = 1") &&
    advertisingRuntime.includes('meta[name="google-adsense-account"]') &&
    advertisingRuntime.includes("delete windowWithAds.adsbygoogle") &&
    advertisingRuntime.includes("script#google-consent-mode-default") &&
    nativeGuardIndex >= 0 &&
    canonicalOriginGuardIndex > nativeGuardIndex &&
    consentDefaultsIndex > canonicalOriginGuardIndex,
  "The server-rendered native layout must not contain AdSense metadata or Consent Mode globals; the web-only runtime may install them only after native and canonical-origin guards.",
);
requireCondition(
  adsenseSlot.includes("Capacitor.isNativePlatform()") &&
    adsenseSlot.includes("isCanonicalProductionOrigin"),
  "The existing AdSense slot must reject native Capacitor runtimes and non-canonical deployment origins.",
);
requireCondition(
  runtimeEffects.includes("Capacitor.isNativePlatform()") &&
    runtimeEffects.includes("isWebRuntime && ADSENSE_CONFIGURED"),
  "The AdSense script loader itself must be gated to web runtime, not only the empty ad slot.",
);
requireCondition(
  /import\s+\{\s*Capacitor\s*\}\s+from\s+["']@capacitor\/core["']/.test(deferredRuntime) &&
    deferredRuntime.includes("if (Capacitor.isNativePlatform())"),
  "Native reminder runtime must import Capacitor directly and initialize immediately without depending on a late window.Capacitor injection.",
);

if (failures.length) {
  console.error("MOBILE_ADS_FREE_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log("MOBILE_ADS_FREE_CHECK_PASSED");
console.log("Native shells exclude Monetag, SmartLinks, GTM ad injection, and AdSense.");

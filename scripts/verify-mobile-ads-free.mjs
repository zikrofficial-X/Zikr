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
const serviceWorker = read("public/sw.js");
const adsenseSlot = read("src/components/layout/adsense-slot.tsx");

requireCondition(
  layout.includes("<WebAdvertisingRuntime />"),
  "The root layout must mount the environment-aware advertising runtime.",
);
requireCondition(
  !/al5sm\.com|5gvci\.com|name="monetag"|fundingchoicesmessages\.google\.com|googletagmanager\.com\/gtm\.js/.test(
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
  serviceWorkerRegister.includes("'/sw.js?native=1'") &&
    serviceWorkerRegister.includes("'/sw.js'"),
  "Native and browser service workers must use distinct script URLs.",
);
requireCondition(
  serviceWorker.includes('searchParams.get("native") === "1"') &&
    serviceWorker.includes("importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')"),
  "The Monetag service-worker import must be conditional and skipped for the native worker.",
);
requireCondition(
  serviceWorker.includes("async function purgeNativeAdvertisingMarkup()") &&
    serviceWorker.includes("await purgeNativeAdvertisingMarkup()"),
  "The native worker must remove cached HTML containing previously published ad markup.",
);
for (const providerMarker of [
  "fundingchoicesmessages",
  "googletagmanager",
  "pagead2",
  "googleads",
  "tpc\\.googlesyndication",
]) {
  requireCondition(
    serviceWorker.includes(providerMarker),
    `The native worker must purge cached HTML containing legacy ${providerMarker} markup.`,
  );
}
requireCondition(
  adsenseSlot.includes("Capacitor.isNativePlatform()"),
  "The existing AdSense slot must continue to reject native Capacitor runtimes.",
);

if (failures.length) {
  console.error("MOBILE_ADS_FREE_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log("MOBILE_ADS_FREE_CHECK_PASSED");
console.log("Native shells exclude Monetag, SmartLinks, GTM ad injection, and AdSense.");

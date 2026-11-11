import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const layout = readFileSync('src/app/layout.tsx', 'utf8');
const webAdvertisingRuntime = readFileSync('src/components/layout/web-advertising-runtime.tsx', 'utf8');
const deferredAnalytics = readFileSync('src/components/layout/deferred-analytics.tsx', 'utf8');
const nextConfig = readFileSync('next.config.ts', 'utf8');
const approvedGaId = 'G-W30Z9JW0VF';
const approvedGtmId = 'GTM-PVQCFKCB';
const verificationFiles = [
  'public/google3526c15e10fa1913.html',
  'public/google6f7827292f8e19bc.html',
];

for (const file of verificationFiles) {
  if (!existsSync(file)) {
    failures.push(`ملف تحقق مفقود: ${file}`);
    continue;
  }
  const content = readFileSync(file, 'utf8').trim();
  if (!content.includes(`google-site-verification: ${file.replace('public/', '')}`)) {
    failures.push(`محتوى ملف التحقق غير مطابق لاسم الملف: ${file}`);
  }
}

const expectedTokens = [
  'wq9nowZwnBPIzL-Er-1I1Va4CMv-RQ4QqtEsIbdO8fs',
  'Of0DQJPyryp-UqLB2Xdr5bDSkQbm_rU7bjbL6l8uGCs',
];
for (const token of expectedTokens) {
  if (!layout.includes(token)) failures.push(`رمز تحقق غير موجود في src/app/layout.tsx: ${token}`);
}

if (layout.includes('NEXT_PUBLIC_GA_MEASUREMENT_ID') || layout.includes(approvedGaId) || layout.includes('googletagmanager.com/gtag/js')) {
  failures.push('يجب ألا يُحقن GA4 من root layout قبل فحص المضيف والبيئة.');
}
if (!webAdvertisingRuntime.includes('NEXT_PUBLIC_GA_MEASUREMENT_ID')) failures.push('متغير GA4 canonical غير موجود في web-only runtime.');
if (!webAdvertisingRuntime.includes(approvedGaId)) failures.push(`معرّف GA4 المعتمد غير موجود: ${approvedGaId}`);
if (!webAdvertisingRuntime.includes('googletagmanager.com/gtag/js?id=')) failures.push('مصدر GA4 gtag.js غير موجود في web-only runtime.');
if (!webAdvertisingRuntime.includes('canonicalWebRuntime && validAnalyticsId')) failures.push('يجب ألا يُحمّل GA4 إلا بعد اجتياز فحص مضيف الإنتاج canonical.');

if (layout.includes(approvedGtmId) || layout.includes('NEXT_PUBLIC_GTM_ID') || layout.includes('googletagmanager.com/gtm.js')) {
  failures.push('يجب إبقاء GTM خارج root layout حتى لا يُحقن في HTML الخاص بتطبيق Capacitor.');
}
if (!layout.includes('import { WebAdvertisingRuntime } from "@/components/layout/web-advertising-runtime";')) failures.push('استيراد WebAdvertisingRuntime غير موجود في root layout.');
if (!layout.includes('<WebAdvertisingRuntime />')) failures.push('WebAdvertisingRuntime غير مركّب في root layout.');
if (!webAdvertisingRuntime.includes(approvedGtmId)) failures.push(`معرّف GTM المعتمد غير موجود في web-only runtime: ${approvedGtmId}`);
if (!webAdvertisingRuntime.includes('NEXT_PUBLIC_GTM_ID')) failures.push('متغير GTM canonical غير موجود في web-only runtime.');
if (!webAdvertisingRuntime.includes('https://www.googletagmanager.com/gtm.js?id=')) failures.push('مصدر GTM غير موجود في web-only runtime.');
const nativeGuardIndex = webAdvertisingRuntime.indexOf('if (Capacitor.isNativePlatform())');
const canonicalHostGuardIndex = webAdvertisingRuntime.indexOf('if (!isCanonicalProductionHost())');
const gtmInjectionIndex = webAdvertisingRuntime.indexOf('"google-tag-manager"');
const monetagInjectionIndex = webAdvertisingRuntime.indexOf('document.head.appendChild(primary)');
const fundingChoicesInjectionIndex = webAdvertisingRuntime.indexOf('"google-funding-choices"');
if (
  nativeGuardIndex < 0 ||
  canonicalHostGuardIndex < 0 ||
  gtmInjectionIndex < 0 ||
  monetagInjectionIndex < 0 ||
  fundingChoicesInjectionIndex < 0 ||
  nativeGuardIndex > gtmInjectionIndex ||
  nativeGuardIndex > monetagInjectionIndex ||
  nativeGuardIndex > fundingChoicesInjectionIndex ||
  nativeGuardIndex > analytics ||
  canonicalHostGuardIndex > analytics
) {
  failures.push('يجب أن يسبق خروج Capacitor وفحص المضيف canonical كل حقن فعلي لإعلانات الويب وGA4 وGTM وFunding Choices.');
}
if (layout.includes('G-G9DPYTK78')) failures.push('المعرّف القديم G-G9DPYTK78 ما زال موجودًا في root layout.');
if (!layout.includes('strategy="lazyOnload"')) failures.push('GA4 لا يستخدم lazyOnload في root layout.');
if (/import\(.+analytics/.test(deferredAnalytics)) failures.push('تمت إعادة تحميل Analytics ديناميكيًا خارج root layout.');
const frameSrc = nextConfig.match(/frame-src\s+([^;]+)/)?.[1] ?? '';
if (!frameSrc.split(/\s+/).includes('https://www.googletagmanager.com')) failures.push('أصل GTM مفقود من CSP frame-src؛ قد يُحجب إطار noscript.');

if (failures.length) {
  console.error('GOOGLE_SEARCH_CONSOLE_VERIFICATION_FAILED');
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('GOOGLE_SEARCH_CONSOLE_VERIFICATION_PASSED');
console.log(`تم التحقق من ${verificationFiles.length} ملف HTML ورمزي meta.`);

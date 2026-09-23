import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const layout = readFileSync('src/app/layout.tsx', 'utf8');
const deferredAnalytics = readFileSync('src/components/layout/deferred-analytics.tsx', 'utf8');
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

if (!layout.includes('NEXT_PUBLIC_GA_MEASUREMENT_ID')) failures.push('متغير GA4 canonical غير موجود في root layout.');
if (!layout.includes(approvedGaId)) failures.push(`معرّف GA4 المعتمد غير موجود: ${approvedGaId}`);
if (!layout.includes(approvedGtmId)) failures.push(`معرّف GTM المعتمد غير موجود: ${approvedGtmId}`);
if (layout.includes('G-G9DPYTK78')) failures.push('المعرّف القديم G-G9DPYTK78 ما زال موجودًا في root layout.');
if (!layout.includes('strategy="lazyOnload"')) failures.push('GA4/GTM لا يستخدمان lazyOnload في root layout.');
if (!layout.includes('https://www.googletagmanager.com/gtag/js?id=')) failures.push('مصدر gtag.js غير موجود في root layout.');
if (/import\(.+analytics/.test(deferredAnalytics)) failures.push('تمت إعادة تحميل Analytics ديناميكيًا خارج root layout.');
if (!layout.includes('NEXT_PUBLIC_GTM_ID')) failures.push('متغير GTM canonical غير موجود في root layout.');

if (failures.length) {
  console.error('GOOGLE_SEARCH_CONSOLE_VERIFICATION_FAILED');
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('GOOGLE_SEARCH_CONSOLE_VERIFICATION_PASSED');
console.log(`تم التحقق من ${verificationFiles.length} ملف HTML ورمزي meta.`);

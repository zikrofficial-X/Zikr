import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const layout = readFileSync('app/layout.tsx', 'utf8');
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
  if (!layout.includes(token)) failures.push(`رمز تحقق غير موجود في app/layout.tsx: ${token}`);
}

if (failures.length) {
  console.error('GOOGLE_SEARCH_CONSOLE_VERIFICATION_FAILED');
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('GOOGLE_SEARCH_CONSOLE_VERIFICATION_PASSED');
console.log(`تم التحقق من ${verificationFiles.length} ملف HTML ورمزي meta.`);

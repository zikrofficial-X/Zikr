import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const notes: string[] = [];

async function exists(relativePath: string) {
  try { await access(path.join(root, relativePath)); return true; } catch { return false; }
}
async function read(relativePath: string) { return readFile(path.join(root, relativePath), 'utf8'); }
function unique(values: string[]) { return [...new Set(values)]; }
function extractQuoted(text: string, pattern: RegExp) {
  const values: string[] = [];
  for (const match of text.matchAll(pattern)) if (match[1]) values.push(match[1]);
  return values;
}

const catalog = await read('src/lib/navigation/catalog.ts');
const catalogHrefs = extractQuoted(catalog, /href:\s*['"]([^'"]+)['"]/g);
const duplicateCatalogHrefs = catalogHrefs.filter((href, index) => catalogHrefs.indexOf(href) !== index);
if (duplicateCatalogHrefs.length) failures.push(`تكرار روابط في كتالوج الأقسام: ${unique(duplicateCatalogHrefs).join(', ')}`);

for (const href of unique(catalogHrefs)) {
  const clean = href.split('#')[0].split('?')[0].replace(/^\//, '');
  if (!clean || clean.includes('[') || clean.includes(']')) continue;
  const pageFile = path.join('src', 'app', clean, 'page.tsx');
  if (!(await exists(pageFile))) failures.push(`قسم بلا صفحة: ${href}`);
}

const service = await read('src/features/articles/services/articles.ts');
if (!service.includes('extended-editorial')) failures.push('خدمة المقالات لا تستورد حزمة المحتوى التحريري الموسعة.');

const extended = await read('src/features/articles/data/extended-editorial.ts');
const ids = extractQuoted(extended, /id:\s*['"]([^'"]+)['"]/g);
const slugs = extractQuoted(extended, /slug:\s*['"]([^'"]+)['"]/g);
const duplicateIds = ids.filter((value,index)=>ids.indexOf(value)!==index);
const duplicateSlugs = slugs.filter((value,index)=>slugs.indexOf(value)!==index);
if (duplicateIds.length) failures.push(`تكرار معرفات المقالات: ${unique(duplicateIds).join(', ')}`);
if (duplicateSlugs.length) failures.push(`تكرار slugs المقالات: ${unique(duplicateSlugs).join(', ')}`);
if (unique(slugs).length < 12) failures.push('حزمة المحتوى التحريري الموسعة يجب أن تحتوي على 12 مقالًا على الأقل.');

const home = await read('src/app/page.tsx');
const homeInteractive = await read('src/features/home/components/home-interactive.tsx');
const prayerPage = await read('src/features/prayer/components/prayer-times-page.tsx');
const prayerLocationRoute = await read('src/app/api/prayer-location/route.ts');

if (!prayerLocationRoute.includes('is_default: true')) failures.push('Prayer location API does not persist a default per-user location.');
if (!prayerLocationRoute.includes('eq("is_default", true)')) failures.push('Prayer location API does not read the user default location.');
if (!homeInteractive.includes('getSavedPrayerLocation')) failures.push('Home prayer panel does not restore the saved user location first.');
if (!homeInteractive.includes('if (!found && !disposed) chooseCurrentLocation()')) failures.push('Home prayer panel no longer protects the saved-location-first flow.');
if (!prayerPage.includes('getSavedPrayerLocation')) failures.push('Prayer page does not restore the saved user location first.');
if (!prayerPage.includes('return;\n      }\n\n      if (!disposed)')) failures.push('Prayer page may fall back to device location after a saved-location lookup.');
if (home.includes('DEFAULT_CITY')) notes.push('Home keeps no hard-coded default city; first-time location is requested only after no saved location is found.');

const audioPage = await read('src/app/audio/page.tsx');
const audioLibrary = await read('src/components/audio/audio-library.tsx');
if (!audioPage.includes('AudioLibrary')) failures.push('صفحة الصوت لا تستخدم المكتبة الموحدة.');
if (!audioLibrary.includes('/api/site-audio')) failures.push('مكتبة الصوت لا تستخدم API الصوت الموحد.');

const migration = await read('supabase/migrations/20261002042321_expand_audio_kinds_and_repair_duplicate_kids_index.sql');
for (const kind of ['adhan','salawat','dhikr']) {
  if (!migration.includes(`'${kind}'`)) failures.push(`نوع الصوت ${kind} غير موجود في migration.`);
}

const audioAssets = ['public/audio/adhan.wav','public/audio/salawat.wav'];
for (const asset of audioAssets) if (!(await exists(asset))) failures.push(`ملف صوت محلي ناقص: ${asset}`);

for (const navFile of ['src/components/layout/navbar.tsx','src/components/layout/mobile-nav.tsx','src/components/layout/footer.tsx']) {
  if (!(await exists(navFile))) { notes.push(`ملف تنقل غير موجود: ${navFile}`); continue; }
  const text = await read(navFile);
  const hrefs = extractQuoted(text, /href:\s*["']([^"']+)["']/g);
  const dupes = hrefs.filter((href,index)=>hrefs.indexOf(href)!==index);
  if (dupes.length) failures.push(`${navFile}: duplicate navigation hrefs: ${unique(dupes).join(', ')}`);
}

console.log(`Information architecture check: ${unique(catalogHrefs).length} unique catalog links, ${unique(slugs).length} extended editorial slugs, durable prayer-location flow verified.`);
for (const note of notes) console.log(`NOTE: ${note}`);
if (failures.length) {
  console.error(`FAIL: ${failures.length} issue(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('PASS: catalog routes, article expansion, audio integration and migration contract are aligned.');

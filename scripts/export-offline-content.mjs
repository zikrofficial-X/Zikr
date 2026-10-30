import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'public/offline-content/v1');
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const apiKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLIC_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !apiKey) {
  if (process.argv.includes('--required')) {
    throw new Error('Offline export requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and a Supabase service-role or public anon key.');
  }
  console.warn('[offline-export] Supabase server credentials are not configured; keeping the checked-in offline snapshot.');
  process.exit(0);
}

const datasets = [
  ['surahs', 'quran_surahs', 'select=*', 'order=order.asc'],
  ['ayahs', 'quran_ayahs', 'select=*', 'order=surah_id.asc,ayah_number.asc'],
  ['tafsir', 'quran_tafsir', 'select=*', 'order=surah_id.asc,ayah_number.asc,author.asc'],
  ['hadith_books', 'hadith_books', 'select=*', 'order=slug.asc'],
  ['hadith', 'hadiths', 'select=*', 'published=eq.true', 'order=book_id.asc,hadith_number.asc'],
  ['prophets', 'prophets', 'select=*', 'published=eq.true', 'order=order_num.asc'],
  ['prophet_sections', 'prophet_sections', 'select=*', 'order=prophet_id.asc,order_num.asc'],
  ['battles', 'battles', 'select=*', 'published=eq.true', 'order=order_num.asc'],
  ['battle_events', 'battle_events', 'select=*', 'order=battle_id.asc,order_num.asc'],
  ['conquests', 'conquests', 'select=*', 'published=eq.true', 'order=order_num.asc'],
  ['conquest_events', 'conquest_events', 'select=*', 'order=conquest_id.asc,order_num.asc'],
  ['articles', 'articles', 'select=*', 'published=eq.true', 'order=created_at.desc'],
  ['duas', 'duas', 'select=*', 'published=eq.true', 'order=created_at.asc'],
  ['kids', 'kids_content', 'select=*', 'published=eq.true', 'is_active=eq.true', 'order=created_at.asc'],
  ['companions', 'companions', 'select=*', 'published=eq.true', 'order=order_num.asc'],
  ['companion_stories', 'companion_stories', 'select=*', 'order=companion_id.asc,order_num.asc'],
  ['scholars', 'scholars', 'select=*', 'published=eq.true', 'order=name_ar.asc'],
  ['tawasheeh', 'tawasheeh', 'select=*', 'published=eq.true', 'is_active=eq.true', 'order=created_at.asc'],
  ['quran_reciters', 'quran_reciters', 'select=*', 'order=name_ar.asc'],
  ['quran_audio', 'quran_audio', 'select=*', 'order=surah_id.asc,reciter_id.asc'],
  ['kids_games', 'kids_games', 'select=*', 'published=eq.true', 'order=order_index.asc'],
  ['kids_game_levels', 'kids_game_levels', 'select=*', 'published=eq.true', 'order=game_id.asc,level_no.asc'],
];

async function fetchAll(table, filters) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const params = new URLSearchParams();
    for (const filter of filters) {
      const index = filter.indexOf('=');
      params.append(filter.slice(0, index), filter.slice(index + 1));
    }
    params.set('limit', String(pageSize));
    params.set('offset', String(offset));
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      const body = (await response.text()).slice(0, 800);
      throw new Error(`Offline export failed for ${table} (${response.status}): ${body}`);
    }
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error(`Offline export returned a non-array for ${table}.`);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

await mkdir(outputDir, { recursive: true });
const manifestPath = path.join(outputDir, 'manifest.json');
let previous = { routes: [] };
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* first export */ }
const manifest = {
  version: `2026-10-30-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`,
  generatedAt: new Date().toISOString(),
  source: 'Zikr Supabase published public content tables',
  licenseNote: 'Quran and hadith records retain source attribution. Editorial records are Zikr content. External audio remains a reference unless the file is explicitly packaged locally.',
  datasets: {},
  routes: Array.isArray(previous.routes) ? previous.routes : [],
};

for (const [dataset, table, ...filters] of datasets) {
  const rows = await fetchAll(table, filters);
  const fileName = `${dataset}.json`;
  await writeFile(path.join(outputDir, fileName), `${JSON.stringify(rows)}\n`, 'utf8');
  manifest.datasets[dataset] = { path: `/offline-content/v1/${fileName}`, count: rows.length };
  console.log(`[offline-export] ${dataset}: ${rows.length}`);
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`[offline-export] Wrote ${Object.keys(manifest.datasets).length} datasets; version ${manifest.version}`);

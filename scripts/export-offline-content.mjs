import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getBlockedKidsRoutes } from './lib/offline-kids-route-safety.mjs';
import { getPublishedParentScope, isParentScopedOfflineDataset } from './lib/offline-export-parent-scope.mjs';
import { getBlockedPublishedContentRoutes } from './lib/offline-export-route-pruning.mjs';

const root = process.cwd();
const outputDir = path.join(root, 'public/offline-content/v1');
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const apiKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLIC_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !apiKey) {
  if (process.argv.includes('--required')) {
    throw new Error('Offline snapshot refresh requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and a protected Supabase key.');
  }
  // Ordinary app builds never refresh the snapshot. The scheduled/manual
  // GitHub workflow invokes this script with --required and commits a complete,
  // validated snapshot before a subsequent deployment picks it up.
  console.warn('[offline-export] No Supabase credentials; keeping the committed public snapshot unchanged.');
  process.exit(0);
}

const datasets = [
  ['surahs', 'quran_surahs', 'select=*', 'order=order.asc,id.asc'],
  ['ayahs', 'quran_ayahs', 'select=*', 'order=surah_id.asc,ayah_number.asc,id.asc'],
  ['tafsir', 'quran_tafsir', 'select=*', 'order=surah_id.asc,ayah_number.asc,author.asc,id.asc'],
  ['hadith_books', 'hadith_books', 'select=*', 'order=slug.asc,id.asc'],
  ['hadith', 'hadiths', 'select=*', 'published=eq.true', 'order=book_id.asc,hadith_number.asc,id.asc'],
  ['prophets', 'prophets', 'select=*', 'published=eq.true', 'order=order_num.asc,id.asc'],
  ['prophet_sections', 'prophet_sections', 'select=*', 'order=prophet_id.asc,order_num.asc,id.asc'],
  ['battles', 'battles', 'select=*', 'published=eq.true', 'order=order_num.asc,id.asc'],
  ['battle_events', 'battle_events', 'select=*', 'order=battle_id.asc,order_num.asc,id.asc'],
  ['conquests', 'conquests', 'select=*', 'published=eq.true', 'order=order_num.asc,id.asc'],
  ['conquest_events', 'conquest_events', 'select=*', 'order=conquest_id.asc,order_num.asc,id.asc'],
  ['articles', 'articles', 'select=*', 'published=eq.true', 'order=created_at.desc,id.asc'],
  ['duas', 'duas', 'select=*', 'published=eq.true', 'order=created_at.asc,id.asc'],
  ['kids', 'kids_content', 'select=*', 'published=eq.true', 'is_active=eq.true', 'order=created_at.asc,id.asc'],
  ['companions', 'companions', 'select=*', 'published=eq.true', 'order=order_num.asc,id.asc'],
  ['stories', 'stories', 'select=id,slug,title,content,mood,category,created_at,updated_at,published,metadata,summary,is_approved', 'published=eq.true', 'is_approved=eq.true', 'order=created_at.desc,id.asc'],
  ['article_categories', 'article_categories', 'select=*', 'published=eq.true', 'is_active=eq.true', 'order=slug.asc,id.asc'],
  ['companion_stories', 'companion_stories', 'select=*', 'order=companion_id.asc,order_num.asc,id.asc'],
  ['scholars', 'scholars', 'select=*', 'published=eq.true', 'order=name_ar.asc,id.asc'],
  ['tawasheeh', 'tawasheeh', 'select=*', 'published=eq.true', 'is_active=eq.true', 'order=created_at.asc,id.asc'],
  ['quran_reciters', 'quran_reciters', 'select=*', 'order=name_ar.asc,id.asc'],
  ['quran_audio', 'quran_audio', 'select=*', 'order=surah_id.asc,reciter_id.asc,id.asc'],
  ['kids_games', 'kids_games', 'select=*', 'published=eq.true', 'order=order_index.asc,id.asc'],
  ['kids_game_levels', 'kids_game_levels', 'select=*', 'published=eq.true', 'order=game_id.asc,level_no.asc,id.asc'],
  ['dua_categories', 'dua_categories', 'select=*', 'published=eq.true', 'is_active=eq.true', 'order=slug.asc,id.asc'],
];

const minimumRecords = {
  surahs: 114,
  ayahs: 6000,
  tafsir: 6000,
  hadith_books: 1,
  hadith: 2000,
  prophets: 25,
  prophet_sections: 100,
  battles: 20,
  battle_events: 50,
  conquests: 10,
  conquest_events: 30,
  articles: 10,
  duas: 20,
  kids: 20,
  companions: 10,
  stories: 10,
  article_categories: 3,
  companion_stories: 10,
  scholars: 5,
  tawasheeh: 5,
  quran_reciters: 100,
  quran_audio: 10000,
  kids_games: 10,
  kids_game_levels: 500,
  dua_categories: 3,
};

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

const manifestPath = path.join(outputDir, 'manifest.json');
let previous = { routes: [], datasets: {} };
try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* first export */ }
let previousKidsRows = [];
try {
  const previousKids = JSON.parse(await readFile(path.join(outputDir, 'kids.json'), 'utf8'));
  if (Array.isArray(previousKids)) previousKidsRows = previousKids;
} catch { /* first export */ }

let blockedKidsRoutes = new Set();
const exported = [];
for (const [dataset, table, ...filters] of datasets) {
  const parentScope = getPublishedParentScope(dataset, exported);
  let rows = parentScope?.hasParents === false
    ? []
    : await fetchAll(table, parentScope?.filter ? [...filters, parentScope.filter] : filters);
  if (dataset === 'kids') {
    blockedKidsRoutes = getBlockedKidsRoutes(previousKidsRows, rows, previous.routes);
    rows = rows.filter((row) => row && (row.type !== 'story' || row.metadata?.age_appropriate === true));
  }
  const configuredMinimum = minimumRecords[dataset] ?? 0;
  const minimum = isParentScopedOfflineDataset(dataset) ? 0 : configuredMinimum;
  if (isParentScopedOfflineDataset(dataset) && rows.length < configuredMinimum) {
    console.warn(
      `[offline-export] ${dataset} has ${rows.length} rows after filtering to published parents; exporting the complete public subset instead of retaining hidden child records.`,
    );
  }
  let stale = false;
  let source = 'supabase';

  // Tafsir is a separately curated corpus. The live table may be temporarily
  // empty while the last validated, attributed offline corpus remains intact.
  // Never invent tafsir text or replace a known-good offline corpus with [].
  if (dataset === 'tafsir' && rows.length < minimum) {
    const previousDefinition = previous.datasets?.tafsir;
    const previousPath = typeof previousDefinition?.path === 'string'
      ? previousDefinition.path
      : '';
    if (previousPath !== '/offline-content/v1/tafsir.json' ||
        !Number.isInteger(previousDefinition?.count) ||
        previousDefinition.count < minimum) {
      throw new Error(`Offline export safety check failed for tafsir: live source returned ${rows.length} rows and no complete validated offline corpus is available.`);
    }
    const previousRows = JSON.parse(await readFile(path.join(root, 'public', previousPath.slice(1)), 'utf8'));
    if (!Array.isArray(previousRows) || previousRows.length !== previousDefinition.count || previousRows.length < minimum) {
      throw new Error('The previous offline tafsir corpus failed its integrity check; refusing to publish an incomplete snapshot.');
    }
    rows = previousRows;
    stale = true;
    source = 'previous-validated-snapshot';
    console.warn(`[offline-export] tafsir live table is empty; retaining ${rows.length} previously validated, attributed rows without fabricating content.`);
  }

  if (rows.length < minimum) {
    throw new Error(`Offline export safety check failed for ${dataset}: expected at least ${minimum} rows, received ${rows.length}.`);
  }
  exported.push({ dataset, rows, stale, source });
  console.log(`[offline-export] verified ${dataset}: ${rows.length} (${source})`);
}

const blockedPublishedContentRoutes = getBlockedPublishedContentRoutes(previous.routes, exported);
const blockedRoutes = new Set([...blockedKidsRoutes, ...blockedPublishedContentRoutes]);

await mkdir(outputDir, { recursive: true });
const generatedAt = new Date().toISOString();
const stamp = generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14);
const manifest = {
  version: `${stamp.slice(0, 8)}-${stamp}`,
  generatedAt,
  source: 'Zikr Supabase public-content snapshot; the exporter retains the last validated tafsir corpus only if live quran_tafsir falls below its safety floor',
  licenseNote: 'Quran and hadith records retain source attribution. Editorial records are Zikr content. External audio remains a reference unless the file is explicitly packaged locally.',
  staleDatasets: exported.filter((item) => item.stale).map((item) => item.dataset),
  datasets: {},
  routes: Array.isArray(previous.routes)
    ? previous.routes.filter((route) => !blockedRoutes.has(route))
    : [],
};

for (const { dataset, rows, stale, source } of exported) {
  const fileName = `${dataset}.json`;
  if (!stale) await writeFile(path.join(outputDir, fileName), `${JSON.stringify(rows)}\n`, 'utf8');
  manifest.datasets[dataset] = {
    path: `/offline-content/v1/${fileName}`,
    count: rows.length,
    source,
    stale,
  };
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`[offline-export] Wrote ${Object.keys(manifest.datasets).length} validated datasets; version ${manifest.version}`);

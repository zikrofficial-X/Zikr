import { searchHadith } from '@/lib/services/hadith';
import type { Hadith } from '@/lib/types/hadith';
import { searchQuran } from '@/lib/services/quran';
import { supabaseServerAnonRequest } from '@/lib/supabase/server';

export type SpiritualSourceKind =
  | 'quran'
  | 'hadith'
  | 'dua'
  | 'article'
  | 'prophet'
  | 'battle'
  | 'conquest'
  | 'companion'
  | 'kids'
  | 'site';

export type SpiritualSource = {
  kind: SpiritualSourceKind;
  label: string;
  title: string;
  reference: string;
  excerpt: string;
  url?: string;
  sourceUrl?: string;
  authority: 'primary' | 'site' | 'fallback';
};

const MAX_QUERY_LENGTH = 96;
const MAX_EXCERPT_LENGTH = 1400;
const MAX_SOURCES = 14;

const SEARCH_STOPWORDS = new Set([
  'ما', 'ماذا', 'كيف', 'هل', 'لماذا', 'متى', 'أين', 'من', 'عن', 'في', 'على', 'إلى', 'مع',
  'هذا', 'هذه', 'ذلك', 'تلك', 'الذي', 'التي', 'انا', 'أنا', 'أريد', 'اريد', 'أحتاج', 'احتاج',
  'قصة', 'حكم', 'الإسلام', 'الاسلام', 'إسلام', 'اسلام', 'الله', 'نبي', 'النبي', 'غزوة', 'غزوات',
  'حدث', 'أحداث', 'معلومة', 'معلومات', 'اشعر', 'أشعر', 'لدي', 'عندي', 'هل', 'فيه', 'عليه',
]);

function cleanQuery(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

function normalizeArabicToken(token: string): string {
  return token
    .replace(/^(?:و|ف|ب|ك|ل)(?=ال)/u, '')
    .replace(/^(?:و|ف|ب|ك|ل)(?=.{3,})/u, '');
}

const PRIORITY_SEARCH_TERMS = [
  'الربا', 'ربا', 'الفائدة', 'فوائد', 'الصلاة', 'الزكاة', 'الصيام', 'الحج',
  'الطلاق', 'الميراث', 'النكاح', 'الزواج', 'الوضوء', 'الغسل', 'الحجاب',
  'التوبة', 'الاستغفار', 'الدعاء', 'الأذكار', 'الحديث', 'السنة', 'التفسير',
  'يوسف', 'موسى', 'إبراهيم', 'محمد', 'بدر', 'أحد', 'الهجرة', 'الصحابة',
];

export function deriveSpiritualSearchTerm(value: string): string {
  const normalized = cleanQuery(value);
  const tokens = normalized
    .split(' ')
    .map(normalizeArabicToken)
    .filter(token => token.length >= 3 && !SEARCH_STOPWORDS.has(token));
  const priorityToken = tokens.find(token =>
    PRIORITY_SEARCH_TERMS.some(priority => token.includes(priority) || priority.includes(token)),
  );
  return (priorityToken ?? tokens.sort((a, b) => b.length - a.length)[0] ?? normalized).slice(0, MAX_QUERY_LENGTH);
}

function searchTerm(value: string): string {
  return deriveSpiritualSearchTerm(value);
}

function likeFilter(fields: string[], value: string): string {
  const term = cleanQuery(value);
  return encodeURIComponent(`(${fields.map(field => `${field}.ilike.*${term}*`).join(',')})`);
}

function excerpt(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_EXCERPT_LENGTH);
}

function sourceFromRow(
  kind: SpiritualSourceKind,
  label: string,
  row: Record<string, unknown>,
  titleKeys: string[],
  reference: string,
  contentKeys: string[],
  url?: string,
): SpiritualSource | null {
  const title = titleKeys.map(key => row[key]).find(value => String(value ?? '').trim()) as string | undefined;
  const content = contentKeys.map(key => row[key]).find(value => String(value ?? '').trim());
  const text = excerpt(content ?? title);
  if (!text) return null;
  return {
    kind,
    label,
    title: String(title ?? label),
    reference,
    excerpt: text,
    url,
    sourceUrl: typeof row.source_url === 'string' ? row.source_url : undefined,
    authority: kind === 'quran' || kind === 'hadith' ? 'primary' : 'site',
  };
}

async function queryRows(
  path: string,
  kind: SpiritualSourceKind,
  label: string,
  titleKeys: string[],
  referenceKey: string | ((row: Record<string, unknown>) => string),
  contentKeys: string[],
  urlBuilder?: (row: Record<string, unknown>) => string | undefined,
): Promise<SpiritualSource[]> {
  try {
    const rows = await supabaseServerAnonRequest<Record<string, unknown>[]>(path);
    return rows
      .map(row => sourceFromRow(
        kind,
        label,
        row,
        titleKeys,
        `${label} — ${typeof referenceKey === 'function' ? referenceKey(row) : String(row[referenceKey] ?? row.id ?? '')}`,
        contentKeys,
        urlBuilder?.(row),
      ))
      .filter((item): item is SpiritualSource => Boolean(item));
  } catch (error) {
    console.warn(`[spiritual-retriever] source unavailable: ${label}`, error instanceof Error ? error.message : error);
    return [];
  }
}

function mapHadith(item: Hadith): SpiritualSource {
  return {
    kind: 'hadith',
    label: 'حديث',
    title: 'حديث نبوي',
    reference: item.id ? `حديث رقم ${item.number} — ${item.id}` : `حديث رقم ${item.number}`,
    excerpt: excerpt(item.arab ?? item.id),
    authority: 'primary',
  };
}

export function deriveQuranSearchVariants(term: string): string[] {
  const variants = new Set([term]);
  const aliases: Record<string, string[]> = {
    'الربا': ['ٱلرِّب'],
    'الفائدة': ['ٱلرِّب'],
    'الصلاة': ['ٱلصَّل'],
    'الزكاة': ['ٱلزَّك'],
    'الصيام': ['ٱلصِّي'],
    'الحج': ['ٱلْحَج'],
    'التوبة': ['تُوب'],
  };
  for (const alias of aliases[term] ?? []) variants.add(alias);
  return [...variants];
}

async function retrieveLocalQuran(query: string): Promise<SpiritualSource[]> {
  const term = cleanQuery(query);
  if (!term) return [];

  const rows = (await Promise.all(deriveQuranSearchVariants(term).map(async variant => {
    try {
      return await supabaseServerAnonRequest<Record<string, unknown>[]>(
        `/rest/v1/quran_ayahs?select=surah_id,ayah_number,text_ar,text_uthmani&text_ar=ilike.*${encodeURIComponent(variant)}*&limit=5`,
      );
    } catch {
      return [];
    }
  }))).flat();

  return rows
    .map(row => sourceFromRow(
      'quran',
      'آية قرآنية من مكتبة ZIKR',
      row,
      ['text_ar'],
      `سورة رقم ${String(row.surah_id ?? 'غير محدد')}، آية ${String(row.ayah_number ?? '')}`,
      ['text_uthmani', 'text_ar'],
    ))
    .filter((item): item is SpiritualSource => Boolean(item));
}

async function retrieveFallbackQuran(query: string): Promise<SpiritualSource[]> {
  try {
    const verses = await searchQuran(query, 'ar');
    return verses.slice(0, 5).map(verse => ({
      kind: 'quran' as const,
      label: 'آية قرآنية',
      title: 'القرآن الكريم',
      reference: `آية ${verse.numberInSurah} (رقم ${verse.number})`,
      excerpt: excerpt(verse.text),
      authority: 'fallback' as const,
    }));
  } catch {
    return [];
  }
}

export async function retrieveSpiritualSources(question: string): Promise<SpiritualSource[]> {
  const query = searchTerm(question);
  if (!query) return [];

  const filter = likeFilter;
  const requests = await Promise.all([
    retrieveLocalQuran(query),
    queryRows(
      `/rest/v1/articles?select=id,title,slug,summary,content&published=eq.true&or=${filter(['title', 'summary', 'content'], query)}&limit=4`,
      'article', 'مقال من مكتبة ZIKR', ['title'], 'slug', ['content', 'summary'], row => row.slug ? `/articles/${row.slug}` : undefined,
    ),
    queryRows(
      `/rest/v1/duas?select=id,title_ar,slug,text_ar,source_ar,benefits_ar&published=eq.true&or=${filter(['title_ar', 'text_ar', 'source_ar', 'benefits_ar'], query)}&limit=4`,
      'dua', 'دعاء من مكتبة ZIKR', ['title_ar'], 'slug', ['text_ar', 'source_ar', 'benefits_ar'], row => row.slug ? `/dua/${row.slug}` : undefined,
    ),
    queryRows(
      `/rest/v1/quran_tafsir?select=id,surah_id,ayah_number,author,tafsir_ar,source_url,retrieved_at&or=${filter(['tafsir_ar', 'author'], query)}&limit=4`,
      'quran', 'تفسير قرآني متاح في ZIKR', ['author'], row => `سورة ${String(row.surah_id ?? '?')}، آية ${String(row.ayah_number ?? '?')} — ${String(row.author ?? 'غير محدد')}`, ['tafsir_ar'],
    ),
    queryRows(
      `/rest/v1/prophets?select=id,name_ar,slug,bio_ar&published=eq.true&or=${filter(['name_ar', 'bio_ar'], query)}&limit=3`,
      'prophet', 'قصة نبي من مكتبة ZIKR', ['name_ar'], 'slug', ['bio_ar'], row => row.slug ? `/prophets/${row.slug}` : undefined,
    ),
    queryRows(
      `/rest/v1/prophet_sections?select=id,title_ar,content_ar,section_type,order_num&or=${filter(['title_ar', 'content_ar'], query)}&limit=5`,
      'prophet', 'قسم من قصص الأنبياء في ZIKR', ['title_ar'], 'id', ['content_ar'],
    ),
    queryRows(
      `/rest/v1/battles?select=id,name_ar,slug,description_ar,date_hijri&published=eq.true&or=${filter(['name_ar', 'description_ar'], query)}&limit=3`,
      'battle', 'غزوة من مكتبة ZIKR', ['name_ar'], 'slug', ['description_ar', 'date_hijri'], row => row.slug ? `/battles/${row.slug}` : undefined,
    ),
    queryRows(
      `/rest/v1/battle_events?select=id,title_ar,content_ar,event_type,order_num&or=${filter(['title_ar', 'content_ar'], query)}&limit=5`,
      'battle', 'حدث من السيرة والغزوات في ZIKR', ['title_ar'], 'id', ['content_ar'],
    ),
    queryRows(
      `/rest/v1/conquests?select=id,name_ar,slug,description_ar,date_hijri&published=eq.true&or=${filter(['name_ar', 'description_ar'], query)}&limit=3`,
      'conquest', 'فتح إسلامي من مكتبة ZIKR', ['name_ar'], 'slug', ['description_ar', 'date_hijri'], row => row.slug ? `/conquests/${row.slug}` : undefined,
    ),
    queryRows(
      `/rest/v1/conquest_events?select=id,title_ar,content_ar,event_type,order_num&or=${filter(['title_ar', 'content_ar'], query)}&limit=5`,
      'conquest', 'محطة تاريخية في ZIKR', ['title_ar'], 'id', ['content_ar'],
    ),
    queryRows(
      `/rest/v1/companions?select=id,name_ar,slug,bio_ar,category&published=eq.true&or=${filter(['name_ar', 'bio_ar', 'category'], query)}&limit=3`,
      'companion', 'صحابي من مكتبة ZIKR', ['name_ar'], 'slug', ['bio_ar', 'category'], row => row.slug ? `/companions/${row.slug}` : undefined,
    ),
    queryRows(
      `/rest/v1/companion_stories?select=id,title_ar,content_ar,story_type,order_num&or=${filter(['title_ar', 'content_ar'], query)}&limit=5`,
      'companion', 'قصة صحابي في ZIKR', ['title_ar'], 'id', ['content_ar'],
    ),
    queryRows(
      `/rest/v1/kids_content?select=id,title_ar,slug,content_ar,summary_ar,type&published=eq.true&or=${filter(['title_ar', 'content_ar', 'summary_ar', 'type'], query)}&limit=3`,
      'kids', 'محتوى تعليمي للأطفال في ZIKR', ['title_ar'], 'slug', ['content_ar', 'summary_ar', 'type'], row => row.slug ? `/kids/${row.slug}` : undefined,
    ),
    searchHadith(query).then(items => items.slice(0, 6).map(mapHadith)).catch(() => []),
  ]);

  let sources = requests.flat();
  if (!sources.some(source => source.kind === 'quran')) {
    sources = [...sources, ...(await retrieveFallbackQuran(query))];
  }

  const seen = new Set<string>();
  return sources.filter(source => {
    const key = `${source.kind}:${source.reference}:${source.excerpt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return source.excerpt.length > 0;
  }).slice(0, MAX_SOURCES);
}

export function formatSourcesForPrompt(sources: SpiritualSource[]): string {
  if (!sources.length) return 'لم يتم العثور على مصدر مطابق في مكتبة ZIKR لهذه الرسالة.';
  return sources.map((source, index) => (
    `[المصدر ${index + 1}] النوع: ${source.label}\nالعنوان: ${source.title}\nالمرجع: ${source.reference}\nالنص: ${source.excerpt}`
  )).join('\n\n');
}

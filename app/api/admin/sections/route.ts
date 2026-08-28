import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { supabaseServerAdminRequest } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SECTION_KEYS = new Set([
  'quran', 'hadith', 'adhkar', 'dua', 'prayer-times', 'qibla', 'tasbeeh',
  'prophets', 'companions', 'scholars', 'stories', 'articles', 'battles',
  'conquests', 'memorization', 'spiritual-ai', 'kids', 'competitions',
  'poetry', 'tawasheeh', 'reciters', 'radio', 'videos', 'youtube', 'tafsir',
  'favorites', 'search', 'contact', 'about', 'faq',
]);
const SETTINGS_KEY = 'section_visibility';

type Visibility = Record<string, boolean>;

function defaultVisibility(): Visibility {
  return Object.fromEntries([...SECTION_KEYS].map((key) => [key, true]));
}

function normalizeVisibility(input: unknown): Visibility {
  const normalized = defaultVisibility();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return normalized;
  for (const [key, value] of Object.entries(input)) {
    if (SECTION_KEYS.has(key) && typeof value === 'boolean') normalized[key] = value;
  }
  return normalized;
}

async function readVisibility(): Promise<Visibility> {
  const rows = await supabaseServerAdminRequest<Array<{ value?: unknown }>>(
    `/rest/v1/site_settings?key=eq.${SETTINGS_KEY}&select=value&limit=1`,
  );
  const row = rows?.[0]?.value;
  if (row && typeof row === 'object' && !Array.isArray(row)) {
    const value = row as { visibility?: unknown };
    return normalizeVisibility(value.visibility ?? row);
  }
  return defaultVisibility();
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    return NextResponse.json({ visibility: await readVisibility() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/sections] GET error:', error);
    return NextResponse.json({ error: 'تعذر قراءة إعدادات الأقسام' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json() as { visibility?: unknown };
    const visibility = normalizeVisibility(body.visibility);
    await supabaseServerAdminRequest('/rest/v1/site_settings?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        key: SETTINGS_KEY,
        value: { visibility },
        updated_at: new Date().toISOString(),
      }),
    });
    return NextResponse.json({ ok: true, visibility }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/sections] POST error:', error);
    return NextResponse.json({ error: 'تعذر حفظ إعدادات الأقسام' }, { status: 500 });
  }
}

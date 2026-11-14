import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { readBoundedJsonBody } from '@/lib/request/bounded-json-body';
import { recordAdminAuditEvent } from '@/features/admin/services/audit';
import { runPostCommitAudit } from '@/features/admin/services/post-commit-audit';
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
  const auth = await requireAdminApi('sections.manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    return NextResponse.json({ visibility: await readVisibility() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/sections] GET error:', error);
    return NextResponse.json({ error: 'تعذر قراءة إعدادات الأقسام' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApi('sections.manage');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const bodyResult = await readBoundedJsonBody(request, 8 * 1024);
    if (!bodyResult.ok) {
      return NextResponse.json(
        { error: bodyResult.error },
        { status: bodyResult.status, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const body = bodyResult.value && typeof bodyResult.value === 'object' && !Array.isArray(bodyResult.value)
      ? bodyResult.value as { visibility?: unknown }
      : {};
    const visibility = normalizeVisibility(body.visibility);
    await supabaseServerAdminRequest('/rest/v1/site_settings?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key: SETTINGS_KEY, value: { visibility }, updated_at: new Date().toISOString() }),
    });
    const auditRecorded = await runPostCommitAudit(
      () => recordAdminAuditEvent({
      action: "admin.sections.visibility.update",
      permission: "sections.manage",
      resourceType: "site_settings",
      resourceId: SETTINGS_KEY,
      metadata: {
        enabled: Object.values(visibility).filter(Boolean).length,
        disabled: Object.values(visibility).filter(value => !value).length,
      },
      }),
      (auditError) => console.error("[api/admin/sections] audit event failed after committed mutation:", auditError),
    );
    return NextResponse.json({ ok: true, visibility, auditRecorded }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/sections] POST error:', error);
    return NextResponse.json({ error: 'تعذر حفظ إعدادات الأقسام' }, { status: 500 });
  }
}

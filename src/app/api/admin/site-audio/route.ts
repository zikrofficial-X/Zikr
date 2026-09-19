import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/features/admin/services/admin';
import { createAdminClient } from '@/lib/supabase/server';

const KINDS = new Set(['adhan', 'salawat']);
const select = 'id,kind,title,storage_path,mime_type,size_bytes,is_primary,created_at';

export async function GET() {
  const guard = await requireAdminApi('audio.manage');
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { data, error } = await createAdminClient().from('site_audio_assets').select(select).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assets: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi('audio.manage');
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const body = await request.json().catch(() => null);
  const kind = typeof body?.kind === 'string' ? body.kind : '';
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const storagePath = typeof body?.storagePath === 'string' ? body.storagePath.trim() : '';
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : '';
  const sizeBytes = Number(body?.sizeBytes);
  if (!KINDS.has(kind) || !title || title.length > 120 || !storagePath || !mimeType || !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) return NextResponse.json({ error: 'بيانات المقطع غير صالحة.' }, { status: 400 });
  if (!storagePath.startsWith(`${guard.profile.id.toLowerCase()}/`)) return NextResponse.json({ error: 'مسار الملف غير صالح.' }, { status: 400 });
  const { data, error } = await createAdminClient().from('site_audio_assets').insert({ kind, title, storage_path: storagePath, mime_type: mimeType, size_bytes: sizeBytes, created_by: guard.profile.id }).select(select).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi('audio.manage');
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  const kind = typeof body?.kind === 'string' ? body.kind : '';
  if (!id || !KINDS.has(kind)) return NextResponse.json({ error: 'بيانات المقطع غير صالحة.' }, { status: 400 });
  const db = createAdminClient();
  const { error: clearError } = await db.from('site_audio_assets').update({ is_primary: false }).eq('kind', kind).eq('is_primary', true);
  if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 });
  const { data, error } = await db.from('site_audio_assets').update({ is_primary: true, updated_at: new Date().toISOString() }).eq('id', id).eq('kind', kind).select(select).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ asset: data });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi('audio.manage');
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'معرّف المقطع مطلوب.' }, { status: 400 });
  const db = createAdminClient();
  const { data: asset, error: findError } = await db.from('site_audio_assets').select('storage_path').eq('id', id).single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 404 });
  const { error } = await db.from('site_audio_assets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { error: storageError } = await db.storage.from('site-audio').remove([asset.storage_path]);
  if (storageError) console.error('[site-audio] orphaned storage object:', storageError.message);
  return NextResponse.json({ ok: true });
}

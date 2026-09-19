import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const db = createAdminClient();
    const { data, error } = await db.from('site_audio_assets').select('kind,title,storage_path,updated_at').eq('is_primary', true);
    if (error) throw error;
    const assets = Object.fromEntries((data ?? []).map(asset => [asset.kind, {
      title: asset.title,
      url: db.storage.from('site-audio').getPublicUrl(asset.storage_path).data.publicUrl,
      updatedAt: asset.updated_at,
    }]));
    return NextResponse.json({ assets }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } });
  } catch {
    return NextResponse.json({ assets: {} }, { headers: { 'Cache-Control': 'no-store' } });
  }
}

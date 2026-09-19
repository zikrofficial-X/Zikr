import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseServerAnonRequest } from '@/lib/supabase/server';

type ReciterRow = { id: string };
type AudioRow = {
  audio_url: string;
  source_url: string | null;
  retrieved_at: string | null;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surah = Number.parseInt(url.searchParams.get('surah') ?? '', 10);
  const reciter = (url.searchParams.get('reciter') ?? '').trim();

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return json({ error: 'Invalid surah' }, 400);
  }
  if (!/^[a-z0-9.-]{2,80}$/i.test(reciter)) {
    return json({ error: 'Invalid reciter' }, 400);
  }
  if (!isSupabaseConfigured()) return json({ audio: null });

  try {
    const reciters = await supabaseServerAnonRequest<ReciterRow[]>(
      `/rest/v1/quran_reciters?code=eq.${encodeURIComponent(reciter)}&select=id&limit=1`,
    );
    const reciterId = reciters?.[0]?.id;
    if (!reciterId) return json({ audio: null });

    const rows = await supabaseServerAnonRequest<AudioRow[]>(
      `/rest/v1/quran_audio?surah_id=eq.${surah}&reciter_id=eq.${encodeURIComponent(reciterId)}&select=audio_url,source_url,retrieved_at&limit=1`,
    );
    return json({ audio: rows?.[0] ?? null });
  } catch (error) {
    console.warn('[api/quran/audio] unavailable:', error instanceof Error ? error.message : error);
    return json({ audio: null });
  }
}

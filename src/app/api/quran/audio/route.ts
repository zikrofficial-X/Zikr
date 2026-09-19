import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseServerAnonRequest } from '@/lib/supabase/server';

type ReciterRow = { id: string; code: string };
type AudioRow = {
  audio_url: string;
  source_url: string | null;
  retrieved_at: string | null;
};

const VERIFIED_SURAH_AUDIO_BASES: Record<string, string> = {
  alafasy: "https://server8.mp3quran.net/afs",
  minshawi: "https://server10.mp3quran.net/minsh",
  abdulbasit: "https://server7.mp3quran.net/basit",
  sudais: "https://server11.mp3quran.net/sds",
  shuraim: "https://server7.mp3quran.net/shur",
  mahermuaiqly: "https://server12.mp3quran.net/maher",
  ghamdi: "https://server7.mp3quran.net/s_gmd",
};

function normalizeReciterCode(code: string): string {
  return code.replace(/^ar\\./i, '').trim().toLowerCase();
}

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
    const normalizedCode = normalizeReciterCode(reciter);
    const candidates = [...new Set([reciter, `ar.${normalizedCode}`, normalizedCode])].filter(Boolean);
    let reciterId: string | null = null;

    for (const candidate of candidates) {
      const reciters = await supabaseServerAnonRequest<ReciterRow[]>(
        `/rest/v1/quran_reciters?code=eq.${encodeURIComponent(candidate)}&select=id,code&limit=1`,
      );
      if (reciters?.[0]?.id) {
        reciterId = reciters[0].id;
        break;
      }
    }

    if (reciterId) {
      const rows = await supabaseServerAnonRequest<AudioRow[]>(
        `/rest/v1/quran_audio?surah_id=eq.${surah}&reciter_id=eq.${encodeURIComponent(reciterId)}&select=audio_url,source_url,retrieved_at&limit=1`,
      );
      if (rows?.[0]?.audio_url) return json({ audio: rows[0] });
    }

    // Keep playback available even when an individual DB row is temporarily
    // missing. These templates are the same verified MP3Quran sources used by
    // the restored quran_audio dataset.
    const baseUrl = VERIFIED_SURAH_AUDIO_BASES[normalizedCode];
    if (baseUrl) {
      const audioUrl = `${baseUrl}/${String(surah).padStart(3, "0")}.mp3`;
      return json({
        audio: {
          audio_url: audioUrl,
          source_url: "https://www.mp3quran.net/",
          retrieved_at: null,
        },
      });
    }

    return json({ audio: null });
  } catch (error) {
    console.warn('[api/quran/audio] unavailable:', error instanceof Error ? error.message : error);
    return json({ audio: null });
  }
}

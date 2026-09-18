import { createClient } from '@/lib/supabase/server';
import { getAllSurahs } from '@/lib/services/quran';
import { getCanonicalAyahCount } from '@/lib/utils/surah-mapping';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: surahs, error } = await supabase
      .from('quran_surahs')
      .select('*')
      .order('id', { ascending: true }); // id = surah number

    if (!error && surahs?.length) {
      // Keep the public DB-shaped response compatible while correcting legacy
      // rows whose ayahs_count is missing or zero. The UI mapper already uses
      // the canonical table; this route must not leak invalid counts to clients.
      const normalizedSurahs = surahs.map((surah) => ({
        ...surah,
        ayahs_count:
          typeof surah.ayahs_count === 'number' && surah.ayahs_count > 0
            ? surah.ayahs_count
            : getCanonicalAyahCount(Number(surah.id)),
      }));
      return NextResponse.json(normalizedSurahs);
    }
  } catch (error) {
    console.warn('[api/quran/surahs] Supabase unavailable; using Quran API fallback:', error);
  }

  try {
    return NextResponse.json(await getAllSurahs('ar'));
  } catch (error) {
    console.error('[api/quran/surahs] fallback failed:', error);
    return NextResponse.json({ error: 'Failed to fetch surahs' }, { status: 503 });
  }
}

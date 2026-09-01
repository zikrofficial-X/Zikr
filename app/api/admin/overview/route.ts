import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/services/admin';
import { supabaseServerAdminCount, supabaseServerAdminRequest } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const tables = [
  ['videos', 'الفيديوهات'],
  ['articles', 'المقالات'],
  ['stories', 'القصص'],
  ['duas', 'الأدعية'],
  ['competitions', 'المسابقات'],
  ['kids_content', 'محتوى الأطفال'],
  ['profiles', 'المستخدمون'],
  ['prophets', 'الأنبياء'],
  ['companions', 'الصحابة'],
  ['scholars', 'العلماء'],
  ['conquests', 'الفتوحات'],
  ['battles', 'الغزوات'],
  ['tawasheeh', 'التواشيح'],
  ['quran_reciters', 'القراء'],
  ['quran_surahs', 'السور'],
  ['hadiths', 'الأحاديث'],
] as const;

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const counts = await Promise.all(
      tables.map(async ([table, label]) => [table, { label, count: await supabaseServerAdminCount(table) }] as const),
    );

    const [videoRequests, socialQueue, sections] = await Promise.all([
      supabaseServerAdminRequest<Array<{ status: string }>>(
        '/rest/v1/video_generation_requests?select=status&limit=500',
      ),
      supabaseServerAdminRequest<Array<{ status: string }>>(
        '/rest/v1/social_publish_queue?select=status&limit=500',
      ).catch(() => []),
      supabaseServerAdminRequest<Array<{ value?: unknown }>>(
        '/rest/v1/site_settings?key=eq.section_visibility&select=value&limit=1',
      ).catch(() => []),
    ]);

    const countStatuses = (items: Array<{ status: string }>) => items.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});

    const visibility = sections[0]?.value && typeof sections[0].value === 'object'
      ? (sections[0].value as { visibility?: Record<string, boolean> }).visibility ?? {}
      : {};

    return NextResponse.json({
      counts: Object.fromEntries(counts),
      videoGeneration: countStatuses(videoRequests ?? []),
      socialQueue: countStatuses(socialQueue ?? []),
      sections: {
        total: Object.keys(visibility).length,
        enabled: Object.values(visibility).filter(Boolean).length,
        disabled: Object.values(visibility).filter((v) => !v).length,
      },
      generatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[api/admin/overview] GET:', error);
    return NextResponse.json({ error: 'تعذر تحميل ملخص لوحة الإدارة.' }, { status: 500 });
  }
}

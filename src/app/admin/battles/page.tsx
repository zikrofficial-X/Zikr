export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/services/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type Battle = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  year_hijri: number | null;
  published: boolean;
  metadata: Record<string, string> | null;
};

// ── Server Actions ────────────────────────────────────────────────────────────

async function saveBattleVideoAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const rawUrl = String(formData.get('youtube_url') ?? '').trim();
  if (!id) return;

  let videoId: string | null = null;
  if (rawUrl) {
    const match = rawUrl.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    videoId = match ? match[1] : (rawUrl.length >= 11 ? rawUrl.slice(0, 11) : null);
  }

  const supabase = await createClient();
  const { data: current } = await supabase.from('battles').select('metadata').eq('id', id).single();
  const existingMeta = (current?.metadata as Record<string, string> | null) ?? {};
  const newMeta = videoId
    ? { ...existingMeta, youtube_video_id: videoId }
    : Object.fromEntries(Object.entries(existingMeta).filter(([k]) => k !== 'youtube_video_id'));

  await supabase.from('battles').update({ metadata: newMeta, updated_at: new Date().toISOString() }).eq('id', id);

  revalidatePath('/admin/battles');
  revalidatePath('/battles');
}

async function toggleBattlePublishAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const next = formData.get('next') === 'true';
  if (!id) return;

  const supabase = await createClient();
  await supabase.from('battles').update({ published: next, updated_at: new Date().toISOString() }).eq('id', id);

  revalidatePath('/admin/battles');
  revalidatePath('/battles');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminBattlesPage() {
  await requireAdmin();

  let battles: Battle[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('battles')
      .select('id,name_ar,name_en,slug,year_hijri,published,metadata')
      .order('year_hijri', { ascending: true });
    battles = data ?? [];
  } catch {
    battles = [];
  }

  // Use the same canonical fallback slugs as the public content routes.
  const staticBattles = [
    { slug: 'badr', name_ar: 'غزوة بدر الكبرى', year_hijri: 2 },
    { slug: 'uhud', name_ar: 'غزوة أحد', year_hijri: 3 },
    { slug: 'khandaq', name_ar: 'غزوة الخندق (الأحزاب)', year_hijri: 5 },
    { slug: 'khaybar', name_ar: 'غزوة خيبر', year_hijri: 7 },
    { slug: 'hunayn', name_ar: 'غزوة حنين', year_hijri: 8 },
    { slug: 'tabuk', name_ar: 'غزوة تبوك', year_hijri: 9 },
  ];

  const hasBattles = battles.length > 0;

  return (
    <Container className="max-w-5xl space-y-8 py-8 text-right">
      <section className="space-y-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-brand-gold" />
          <h1 className="text-2xl font-bold text-brand-gold">إدارة الغزوات</h1>
        </div>
        <p className="text-sm text-brand-cream/45 mr-4">
          تحكم في ربط فيديوهات يوتيوب بكل غزوة وضبط حالة النشر.
        </p>
      </section>

      <Card className="p-5 space-y-3 border-brand-gold/25 bg-brand-gold/5">
        <h2 className="font-bold text-brand-gold text-sm">ربط فيديو بغزوة</h2>
        <ol className="space-y-1.5 text-sm text-brand-cream/60 list-decimal list-inside">
          <li>انسخ رابط فيديو يوتيوب الخاص بالغزوة.</li>
          <li>الصقه في حقل &quot;رابط يوتيوب&quot; بجانب اسم الغزوة.</li>
          <li>اضغط &quot;حفظ الفيديو&quot; — يُستخرج المعرّف تلقائياً.</li>
        </ol>
      </Card>

      {hasBattles ? (
        <section className="space-y-4">
          <p className="text-xs text-brand-cream/35 mr-1">{battles.length} غزوة في قاعدة البيانات</p>
          {battles.map((battle) => {
            const currentVideoId = battle.metadata?.youtube_video_id ?? '';
            return (
              <Card key={battle.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-brand-gold text-lg">{battle.name_ar}</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-brand-cream/40">/{battle.slug}</span>
                      {battle.year_hijri && <span className="text-brand-cream/30">{battle.year_hijri} هـ</span>}
                      <Link href={`/battles/${battle.slug}`} target="_blank" className="text-brand-gold/50 hover:text-brand-gold transition-colors">
                        عرض الصفحة ↗
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentVideoId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${currentVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs rounded-full border border-red-500/30 bg-red-950/20 px-3 py-1 text-red-400 hover:bg-red-950/40 transition-colors"
                      >
                        يوتيوب مربوط
                      </a>
                    )}
                    <form action={toggleBattlePublishAction}>
                      <input type="hidden" name="id" value={battle.id} />
                      <input type="hidden" name="next" value={battle.published ? 'false' : 'true'} />
                      <button
                        type="submit"
                        className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                          battle.published
                            ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
                            : 'border-brand-gold/20 bg-black/20 text-brand-cream/40 hover:border-brand-gold/40'
                        }`}
                      >
                        {battle.published ? 'منشورة' : 'مخفية'}
                      </button>
                    </form>
                  </div>
                </div>

                <form action={saveBattleVideoAction} className="flex items-end gap-3">
                  <input type="hidden" name="id" value={battle.id} />
                  <div className="flex-1">
                    <label className="block space-y-1">
                      <span className="text-xs text-brand-cream/50">رابط يوتيوب أو معرّف الفيديو</span>
                      <input
                        name="youtube_url"
                        type="text"
                        defaultValue={currentVideoId ? `https://www.youtube.com/watch?v=${currentVideoId}` : ''}
                        placeholder="https://youtube.com/watch?v=..."
                        dir="ltr"
                        className="w-full rounded-lg border border-brand-gold/20 bg-black/30 px-3 py-2 text-sm text-brand-cream placeholder:text-brand-cream/25 focus:border-brand-gold/50 focus:outline-none transition-colors"
                      />
                    </label>
                  </div>
                  <Button type="submit" className="shrink-0">حفظ الفيديو</Button>
                </form>
              </Card>
            );
          })}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4 text-sm text-amber-300/80" dir="rtl">
            لم تُضف بعد غزوات في قاعدة البيانات. الصفحات تعمل بالبيانات الثابتة حالياً.
          </div>
          <p className="text-xs text-brand-cream/35">الغزوات المتاحة حالياً بالبيانات الثابتة:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {staticBattles.map((b) => (
              <Link
                key={b.slug}
                href={`/battles/${b.slug}`}
                className="rounded-xl border border-brand-gold/15 bg-black/20 p-4 text-center hover:border-brand-gold/30 transition-colors"
              >
                <p className="text-sm font-semibold text-brand-gold">{b.name_ar}</p>
                <p className="text-xs text-brand-cream/35 mt-1">{b.year_hijri} هـ</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireAdminPermission } from '@/features/admin/services/admin';
import {
  getAdminBattles,
  saveAdminBattleVideo,
  setAdminBattlePublished,
} from '@/features/admin/services/battles';
import { parseYouTubeVideoId } from '@/features/admin/services/youtube';
import { revalidatePath } from 'next/cache';

// ── Server Actions ────────────────────────────────────────────────────────────

async function saveBattleVideoAction(formData: FormData) {
  'use server';
  await requireAdminPermission("battles.manage");
  const id = String(formData.get('id') ?? '').trim();
  const rawUrl = String(formData.get('youtube_url') ?? '').trim();
  if (!id) return;

  const videoId = parseYouTubeVideoId(rawUrl);
  await saveAdminBattleVideo(id, videoId);

  revalidatePath('/admin/battles');
  revalidatePath('/battles');
}

async function toggleBattlePublishAction(formData: FormData) {
  'use server';
  await requireAdminPermission("battles.manage");
  const id = String(formData.get('id') ?? '').trim();
  const next = formData.get('next') === 'true';
  if (!id) return;

  await setAdminBattlePublished(id, next);

  revalidatePath('/admin/battles');
  revalidatePath('/battles');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminBattlesPage() {
  await requireAdminPermission("battles.manage");

  const battles = await getAdminBattles();

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
        <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-2">
          <h2 className="font-semibold text-amber-300">لا توجد سجلات غزوات في قاعدة البيانات</h2>
          <p className="text-sm text-brand-cream/50">لن يعرض مركز الإدارة بيانات ثابتة أو وهمية. أضف السجلات إلى قاعدة البيانات أولًا ثم ستظهر هنا.</p>
        </section>
      )
    </Container>
  );
}

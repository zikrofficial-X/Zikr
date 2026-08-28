export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requireAdmin } from '@/lib/services/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type Prophet = {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  order_num: number | null;
  published: boolean;
  bio_ar: string | null;
  metadata: Record<string, string> | null;
};

// ── Server Actions ────────────────────────────────────────────────────────────

async function saveProphetVideoAction(formData: FormData) {
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
  const { data: current } = await supabase.from('prophets').select('metadata').eq('id', id).single();
  const existingMeta = (current?.metadata as Record<string, string> | null) ?? {};
  const newMeta = videoId
    ? { ...existingMeta, youtube_video_id: videoId }
    : Object.fromEntries(Object.entries(existingMeta).filter(([k]) => k !== 'youtube_video_id'));

  await supabase.from('prophets').update({ metadata: newMeta, updated_at: new Date().toISOString() }).eq('id', id);

  revalidatePath('/admin/prophets');
  revalidatePath('/prophets');
}

async function toggleProphetPublishAction(formData: FormData) {
  'use server';
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const next = formData.get('next') === 'true';
  if (!id) return;

  const supabase = await createClient();
  await supabase.from('prophets').update({ published: next, updated_at: new Date().toISOString() }).eq('id', id);

  revalidatePath('/admin/prophets');
  revalidatePath('/prophets');
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function Field({ name, label, placeholder, defaultValue }: { name: string; label: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-brand-cream/50">{label}</span>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
        dir="ltr"
        className="w-full rounded-lg border border-brand-gold/20 bg-black/30 px-3 py-2 text-sm text-brand-cream placeholder:text-brand-cream/25 focus:border-brand-gold/50 focus:outline-none transition-colors"
      />
    </label>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminProphetsPage() {
  await requireAdmin();

  let prophets: Prophet[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('prophets')
      .select('id,name_ar,name_en,slug,order_num,published,bio_ar,metadata')
      .order('order_num', { ascending: true });
    prophets = data ?? [];
  } catch {
    prophets = [];
  }

  // Static fallback list for when DB has no rows
  const staticProphets = [
    { slug: 'adam', name_ar: 'آدم عليه السلام', order_num: 1 },
    { slug: 'nuh', name_ar: 'نوح عليه السلام', order_num: 3 },
    { slug: 'ibrahim', name_ar: 'إبراهيم عليه السلام', order_num: 6 },
    { slug: 'yusuf', name_ar: 'يوسف عليه السلام', order_num: 11 },
    { slug: 'musa', name_ar: 'موسى عليه السلام', order_num: 15 },
    { slug: 'isa', name_ar: 'عيسى عليه السلام', order_num: 24 },
    { slug: 'muhammad', name_ar: 'محمد صلى الله عليه وسلم', order_num: 25 },
  ];

  const hasProphets = prophets.length > 0;

  return (
    <Container className="max-w-5xl space-y-8 py-8 text-right">
      {/* Header */}
      <section className="space-y-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-6 rounded-full bg-brand-gold" />
          <h1 className="text-2xl font-bold text-brand-gold">إدارة قصص الأنبياء</h1>
        </div>
        <p className="text-sm text-brand-cream/45 mr-4">
          تحكم في ربط فيديوهات يوتيوب بكل نبي وضبط حالة النشر.
        </p>
      </section>

      {/* Instructions card */}
      <Card className="p-5 space-y-3 border-brand-gold/25 bg-brand-gold/5">
        <h2 className="font-bold text-brand-gold text-sm">كيف تربط فيديو يوتيوب؟</h2>
        <ol className="space-y-1.5 text-sm text-brand-cream/60 list-decimal list-inside">
          <li>افتح الفيديو على يوتيوب وانسخ رابطه الكامل.</li>
          <li>الصقه في حقل &quot;رابط يوتيوب / معرّف الفيديو&quot; بجانب اسم النبي.</li>
          <li>اضغط &quot;حفظ الفيديو&quot; — النظام يستخرج معرّف الفيديو تلقائياً.</li>
          <li>الفيديو سيظهر مباشرة في صفحة النبي على الموقع.</li>
        </ol>
        <p className="text-xs text-brand-cream/40">
          مثال على رابط صحيح: https://www.youtube.com/watch?v=dQw4w9WgXcQ
          أو المعرف مباشرة: dQw4w9WgXcQ
        </p>
      </Card>

      {/* Prophets list */}
      {hasProphets ? (
        <section className="space-y-4">
          <p className="text-xs text-brand-cream/35 mr-1">{prophets.length} نبي في قاعدة البيانات</p>
          {prophets.map((prophet) => {
            const currentVideoId = prophet.metadata?.youtube_video_id ?? '';
            return (
              <Card key={prophet.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-brand-gold text-lg">{prophet.name_ar}</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-brand-cream/40">/{prophet.slug}</span>
                      {prophet.order_num && <span className="text-brand-cream/30">ترتيب: {prophet.order_num}</span>}
                      <Link href={`/prophets/${prophet.slug}`} target="_blank" className="text-brand-gold/50 hover:text-brand-gold transition-colors">
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
                    <form action={toggleProphetPublishAction}>
                      <input type="hidden" name="id" value={prophet.id} />
                      <input type="hidden" name="next" value={prophet.published ? 'false' : 'true'} />
                      <button
                        type="submit"
                        className={`text-xs rounded-full border px-3 py-1 transition-colors ${
                          prophet.published
                            ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
                            : 'border-brand-gold/20 bg-black/20 text-brand-cream/40 hover:border-brand-gold/40'
                        }`}
                      >
                        {prophet.published ? 'منشور' : 'مخفي'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* YouTube URL form */}
                <form action={saveProphetVideoAction} className="flex items-end gap-3">
                  <input type="hidden" name="id" value={prophet.id} />
                  <div className="flex-1">
                    <Field
                      name="youtube_url"
                      label="رابط يوتيوب أو معرّف الفيديو"
                      placeholder="https://youtube.com/watch?v=... أو dQw4w9WgXcQ"
                      defaultValue={currentVideoId ? `https://www.youtube.com/watch?v=${currentVideoId}` : ''}
                    />
                  </div>
                  <Button type="submit" className="shrink-0">حفظ الفيديو</Button>
                </form>
              </Card>
            );
          })}
        </section>
      ) : (
        /* Static fallback when DB has no rows */
        <section className="space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-4 text-sm text-amber-300/80" dir="rtl">
            لم يُضف بعد أنبياء في قاعدة البيانات. الصفحات تعمل بالبيانات الثابتة حالياً.
            يمكنك ربط فيديوهات بكل نبي بعد إضافته عبر قاعدة البيانات.
          </div>
          <p className="text-xs text-brand-cream/35">الأنبياء المتاحون حالياً بالبيانات الثابتة:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {staticProphets.map((p) => (
              <Link
                key={p.slug}
                href={`/prophets/${p.slug}`}
                className="rounded-xl border border-brand-gold/15 bg-black/20 p-4 text-center hover:border-brand-gold/30 transition-colors"
              >
                <p className="text-sm font-semibold text-brand-gold">{p.name_ar}</p>
                <p className="text-xs text-brand-cream/35 mt-1">/{p.slug}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

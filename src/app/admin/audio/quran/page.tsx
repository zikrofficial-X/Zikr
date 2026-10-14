import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { readAdminRows } from "@/features/admin/services/safe-read";
import { supabaseServerAdminCount } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AudioQuranPage() {
  await requireAdminPermission("audio.manage");

  const [recitersRes, audioRows] = await Promise.all([
    readAdminRows<{ id: string; code: string | null; name_ar: string | null }>(
      "/rest/v1/quran_reciters?select=id,code,name_ar&order=name_en.asc&limit=200",
    ),
    supabaseServerAdminCount("quran_audio").catch(() => null),
  ]);
  const reciters = recitersRes.rows;
  const defaultReciterCode = process.env.QURAN_VIDEO_RECITER_CODE || "alafasy";
  const defaultReciter = reciters.find((row) => row.code === defaultReciterCode) ?? null;

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/audio" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مركز الصوت</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">QURAN AUDIO CATALOG</p>
        <h1 className="text-3xl font-bold text-brand-gold">صوت القرآن</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          الكتالوج الصوتي القرآني هو مصدر التلاوة البشرية. مصنع الفيديو يستخدم quran_audio للتحقق من وجود تلاوة للّقارئ المختار ثم يستخدم رابط الآية الدقيق؛ لا يتم تمرير القرآن إلى TTS.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">عدد القراء</p>
          <p className="mt-2 text-3xl font-bold text-brand-gold">{recitersRes.ok ? reciters.length : "غير متاح"}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">سجلات quran_audio</p>
          <p className="mt-2 text-3xl font-bold text-brand-gold">{audioRows === null ? "غير متاح" : audioRows.toLocaleString("ar-EG-u-nu-latn")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
          <p className="text-xs text-brand-cream/35">القارئ الإنتاجي</p>
          <p className="mt-2 text-xl font-bold text-brand-gold">{defaultReciter?.name_ar || defaultReciterCode}</p>
          <p className="mt-1 text-xs text-brand-cream/35" dir="ltr">{defaultReciterCode}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-gold">القراء المتاحون</h2>
            <p className="mt-1 text-sm text-brand-cream/45">المصنع يثبت قارئًا واحدًا تلقائيًا ويمكن تغييره عبر QURAN_VIDEO_RECITER_CODE بعد المراجعة.</p>
          </div>
          <Link href="/admin/video-factory/voices" className="rounded-xl border border-brand-gold/15 px-3 py-2 text-xs text-brand-gold hover:bg-brand-gold/10">مصنع الأصوات</Link>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {reciters.slice(0, 60).map((reciter) => (
            <div key={reciter.id} className={`rounded-xl border p-3 ${reciter.code === defaultReciterCode ? "border-brand-gold/30 bg-brand-gold/5" : "border-brand-gold/8 bg-black/10"}`}>
              <p className="font-semibold text-brand-cream/80">{reciter.name_ar || reciter.code || "قارئ"}</p>
              <p className="mt-1 text-xs text-brand-cream/35" dir="ltr">{reciter.code || "—"}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-5 text-sm leading-7 text-brand-cream/60">
        لا تعتمد صفحة القرآن على ملفات MP3 داخل Supabase Storage. البيانات المرجعية في quran_audio، وروابط التلاوة الخارجية تُستخدم دون نسخ كتلة صوتية كاملة إلى التخزين.
      </div>
    </Container>
  );
}

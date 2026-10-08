import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { VIDEO_VOICE_PROFILES } from "@/features/videos/services/voice-profiles";

export const dynamic = "force-dynamic";

export default async function AudioTtsAdminPage() {
  await requireAdminPermission("audio.manage");

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/audio" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مركز الصوت</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">ARABIC TTS</p>
        <h1 className="text-3xl font-bold text-brand-gold">تحويل النص العربي إلى صوت</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          هذا المسار للإنتاج المراقب وليس لاستبدال النصوص الدينية. النصوص الحديثية تبقى مقفلة بالمصدر، ويدخل الصوت مرحلة فحص للمدة والسرعة والصمت قبل الرندر النهائي.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VIDEO_VOICE_PROFILES.filter((profile) => profile.mode === "tts").map((profile) => (
          <div key={profile.id} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
            <h2 className="font-bold text-brand-gold">{profile.labelAr}</h2>
            <p className="mt-2 text-xs leading-6 text-brand-cream/45">{profile.descriptionAr}</p>
            <div className="mt-4 space-y-1 text-xs text-brand-cream/60">
              <p dir="ltr">{profile.voice}</p>
              <p dir="ltr">rate {profile.rate} · pitch {profile.pitch}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-6">
        <h2 className="font-semibold text-brand-gold">بوابة منع الأخطاء</h2>
        <ul className="mt-3 space-y-2 text-sm leading-7 text-brand-cream/65">
          <li>• المصدر الديني لا يعاد صياغته داخل الاقتباس.</li>
          <li>• النص يخضع لفحص عربي أساسي قبل التوليد.</li>
          <li>• الصوت يخضع لفحص المدة والـword rate والصمت غير الطبيعي ومستوى الصوت.</li>
          <li>• الفيديو القرآني يرفض TTS تمامًا ويحتاج تلاوة بشرية موثقة.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/video-factory/voices" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/15">ملفات الأصوات</Link>
        <Link href="/admin/video-factory/scripts" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/30 hover:text-brand-gold">مراجعة النصوص</Link>
      </div>
    </Container>
  );
}

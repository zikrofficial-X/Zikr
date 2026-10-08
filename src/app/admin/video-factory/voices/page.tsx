import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { VIDEO_VOICE_PROFILES } from "@/features/videos/services/voice-profiles";

export const dynamic = "force-dynamic";

export default async function VideoFactoryVoicesPage() {
  await requireAdminPermission("video.manage");
  const activeProfile = process.env.ARABIC_TTS_PROFILE || "hadith_male_msa";
  const overrideVoice = process.env.ARABIC_TTS_VOICE || "لا يوجد Override";

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/video-factory" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مصنع الفيديو</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">VOICE FACTORY</p>
        <h1 className="text-3xl font-bold text-brand-gold">مصنع الأصوات</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          كل فئة لها مسار صوت مستقل. القرآن لا يستخدم TTS، والحديث يستخدم ملفًا رجاليًا ثابتًا مع فحص النص والمدة والصمت قبل اعتماد الناتج.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">الملف الافتراضي</p>
          <p className="mt-2 font-semibold text-brand-gold" dir="ltr">{activeProfile}</p>
          <p className="mt-1 text-xs text-brand-cream/35">يمكن Override عبر ARABIC_TTS_VOICE، بينما تبقى القواعد والفحص ثابتة.</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/35">الصوت المحدد يدويًا</p>
          <p className="mt-2 font-semibold text-brand-gold" dir="ltr">{overrideVoice}</p>
          <p className="mt-1 text-xs text-brand-cream/35">للنشر الإنتاجي يفضّل استخدام Profile بدل تغيير الصوت لكل طلب.</p>
        </div>
      </section>

      <section className="space-y-4">
        {VIDEO_VOICE_PROFILES.map((profile) => (
          <article key={profile.id} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-brand-gold">{profile.labelAr}</h2>
                <p className="mt-1 text-xs text-brand-cream/30" dir="ltr">{profile.id}</p>
              </div>
              <span className="rounded-full border border-brand-gold/15 px-3 py-1 text-[11px] text-brand-cream/55">
                {profile.mode === "recorded" ? "تسجيل موثّق" : "TTS"}
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-cream/55">{profile.descriptionAr}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-black/20 p-3"><p className="text-[11px] text-brand-cream/30">الصوت</p><p className="mt-1 text-sm text-brand-cream/75" dir="ltr">{profile.voice || "quran_audio"}</p></div>
              <div className="rounded-xl bg-black/20 p-3"><p className="text-[11px] text-brand-cream/30">السرعة</p><p className="mt-1 text-sm text-brand-cream/75" dir="ltr">{profile.rate}</p></div>
              <div className="rounded-xl bg-black/20 p-3"><p className="text-[11px] text-brand-cream/30">النغمة</p><p className="mt-1 text-sm text-brand-cream/75" dir="ltr">{profile.pitch}</p></div>
              <div className="rounded-xl bg-black/20 p-3"><p className="text-[11px] text-brand-cream/30">النمط</p><p className="mt-1 text-sm text-brand-cream/75">{profile.style}</p></div>
            </div>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/audio/tts" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/15">إدارة TTS</Link>
        <Link href="/admin/video-factory/qa" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/30 hover:text-brand-gold">فحوصات الجودة</Link>
      </div>
    </Container>
  );
}

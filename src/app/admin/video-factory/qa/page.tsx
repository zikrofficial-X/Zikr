import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminSnapshot } from "@/features/admin/services/platform";
import { getVideoEngineConfig } from "@/features/videos/providers/types";

export const dynamic = "force-dynamic";

export default async function VideoFactoryQaPage() {
  await requireAdminPermission("video.manage");
  const snapshot = await getAdminSnapshot();
  const engine = getVideoEngineConfig();

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/video-factory" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مصنع الفيديو</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">VIDEO QUALITY GATE</p>
        <h1 className="text-3xl font-bold text-brand-gold">ضبط جودة الفيديو والصوت</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          كل طلب يمر بفحص مصدر، تطابق نص، وجود فيديو وصوت، دقة وترميز، مدة منطقية ومستوى صوت مقبول قبل اعتباره مكتملًا.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["ترتيب مزودات الفيديو", engine.order.join(" → "), "text-brand-gold"],
          ["AI", engine.aiEnabled ? "مفعل" : "متوقف", engine.aiEnabled ? "text-emerald-300" : "text-amber-200"],
          ["Fallback", engine.order.includes("template") ? "template" : "deterministic template", "text-brand-cream/75"],
          ["الفشل الحالي", String(snapshot.queues.videoFailed), snapshot.queues.videoFailed ? "text-red-300" : "text-emerald-300"],
        ].map(([label, value, cls]) => (
          <div key={label} className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
            <p className="text-xs text-brand-cream/35">{label}</p>
            <p className={`mt-2 text-sm font-bold ${cls}`} dir="ltr">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
          <h2 className="font-semibold text-brand-gold">فحص المصدر</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/55">النص الديني يجب أن يطابق المصدر الحالي المنشور، مع المرجع والدرجة عند وجودهما.</p>
        </article>
        <article className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-5">
          <h2 className="font-semibold text-brand-gold">فحص الصوت</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/55">معدل الكلام، مدة الصوت، الصمت الطويل، ووجود مسار صوتي فعلي تُراجع قبل الرندر النهائي.</p>
        </article>
        <article className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <h2 className="font-semibold text-brand-gold">فحص الإخراج</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/55">MP4/H.264/AAC، الدقة المطلوبة، bitrate مناسب، faststart وعدم وجود فيديو صامت.</p>
        </article>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/video-factory/queue" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/15">فتح طابور الفيديو</Link>
        <Link href="/admin/video-factory/voices" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/30 hover:text-brand-gold">فتح الأصوات</Link>
      </div>
    </Container>
  );
}

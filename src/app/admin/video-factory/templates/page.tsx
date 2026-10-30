import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

const templates = [
  { id: "calm", label: "هادئ", group: "عام", description: "تصميم هادئ للمحتوى التأملي." },
  { id: "dawn", label: "الفجر", group: "عام", description: "هوية ضوئية لمحتوى الصباح والبدايات." },
  { id: "emerald", label: "زمردي", group: "عام", description: "هوية خضراء للمحتوى العام." },
  { id: "gold", label: "ذهبي", group: "عام", description: "هوية ذهبية للمحتوى المميز." },
  { id: "night", label: "ليلي", group: "عام", description: "خلفية ليلية للمحتوى الهادئ." },
  { id: "paper", label: "ورقي", group: "عام", description: "أسلوب ورقي للنصوص والاقتباسات." },
  { id: "rose", label: "وردي", group: "عام", description: "هوية لونية ناعمة للمحتوى المناسب." },
  { id: "kids-garden", label: "حديقة الأطفال", group: "أطفال", description: "قالب من مكتبة أصول الأطفال." },
  { id: "kids-nature", label: "طبيعة الأطفال", group: "أطفال", description: "قالب تعليمي بطابع الطبيعة." },
  { id: "kids-neighborhood", label: "حيّ الأطفال", group: "أطفال", description: "قالب قصصي لعالم الطفل اليومي." },
  { id: "kids-workshop", label: "ورشة الأطفال", group: "أطفال", description: "قالب تعليمي تفاعلي للأطفال." },
] as const;

export default async function VideoFactoryTemplatesPage() {
  await requireAdminPermission("video.manage");
  const standard = templates.filter((item) => item.group === "عام");
  const kids = templates.filter((item) => item.group === "أطفال");

  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <header className="space-y-2">
        <Link href="/admin/video-factory" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مصنع الفيديو</Link>
        <p className="mt-4 text-xs tracking-[0.2em] text-brand-cream/30">VIDEO FACTORY / TEMPLATE LIBRARY</p>
        <h1 className="text-3xl font-bold text-brand-gold">مكتبة قوالب الفيديو</h1>
        <p className="max-w-4xl text-sm leading-7 text-brand-cream/55">
          معاينة الأصول الثابتة الموجودة داخل المشروع. هذه المكتبة توثّق الأصول المتاحة ولا تدّعي وجود محرر قوالب أو تغيير حيّ لإعدادات FFmpeg من لوحة الإدارة.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/40">إجمالي القوالب</p><p className="mt-2 text-3xl font-bold text-brand-gold">{templates.length}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/40">قوالب عامة</p><p className="mt-2 text-3xl font-bold text-brand-cream">{standard.length}</p></div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5"><p className="text-xs text-brand-cream/40">قوالب الأطفال</p><p className="mt-2 text-3xl font-bold text-sky-200">{kids.length}</p></div>
      </section>

      {[{ title: "القوالب العامة", items: standard }, { title: "قوالب الأطفال", items: kids }].map((group) => (
        <section key={group.title} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-brand-gold">{group.title}</h2>
            <span className="text-xs text-brand-cream/35">{group.items.length} أصول SVG</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-brand-gold/10 bg-black/15">
                <div className="relative aspect-[9/16] max-h-[420px] bg-black/25">
                  <Image
                    src={`/video/templates/${item.id}.svg`}
                    alt={`معاينة قالب ${item.label}`}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-brand-gold">{item.label}</h3>
                    <span className="rounded-full border border-brand-gold/15 px-2 py-1 text-[10px] text-brand-cream/55">{item.group}</span>
                  </div>
                  <p className="text-sm leading-6 text-brand-cream/50">{item.description}</p>
                  <p className="text-[11px] text-brand-cream/30" dir="ltr">/public/video/templates/{item.id}.svg</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/video-factory/visuals" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">إعدادات المرئيات</Link>
        <Link href="/admin/video-factory/qa" className="rounded-xl border border-brand-gold/15 px-4 py-2 text-sm text-brand-cream/70">ضبط الجودة</Link>
      </div>
    </Container>
  );
}

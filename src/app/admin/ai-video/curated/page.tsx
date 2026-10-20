import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { CURATED_ADHKAR_SOURCES, CURATED_GENERAL_MESSAGES, CURATED_KIDS_STORY_SOURCES, CURATED_STORY_SOURCES, type CuratedVideoSource } from "@/features/videos/data/curated-content";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

function Section({ title, description, items }: { title: string; description: string; items: readonly CuratedVideoSource[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-brand-gold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-brand-cream/55">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map(item => (
          <Card key={item.id} className="border-brand-gold/15 bg-black/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-bold leading-7 text-brand-cream">{item.title}</h3>
              <span className="shrink-0 rounded-full border border-brand-gold/20 px-2 py-1 text-[10px] text-brand-gold">{item.audience === "kids" ? "قصة أطفال أصلية" : "موثق/محرر"}</span>
            </div>
            <p className="mt-3 leading-8 text-brand-cream/70">{item.text}</p>
            {item.audience === "kids" ? (
              <div className="mt-3 grid gap-2 rounded-xl border border-sky-300/15 bg-sky-300/5 p-3 text-sm text-brand-cream/70 sm:grid-cols-2">
                <p><span className="font-semibold text-brand-gold">السلسلة: </span>{item.seriesTitle}</p>
                <p><span className="font-semibold text-brand-gold">الحلقة: </span>الموسم {item.seasonNumber} — الحلقة {item.episodeNumber}</p>
                <p><span className="font-semibold text-brand-gold">الفئة العمرية: </span>{item.ageGroup}</p>
                <p><span className="font-semibold text-brand-gold">هدف التعلم: </span>{item.learningObjective}</p>
              </div>
            ) : null}
            <div className="mt-4 rounded-xl border border-brand-gold/10 bg-brand-gold/5 p-3 text-sm">
              <p className="font-semibold text-brand-gold">المصدر</p>
              <a className="mt-1 block break-words text-brand-cream/65 underline decoration-brand-gold/30 underline-offset-4" href={item.sourceUrl} target="_blank" rel="noreferrer">
                {item.sourceLabel}
              </a>
              {item.additionalSources?.map(source => (
                <a key={source.url} className="mt-1 block break-words text-brand-cream/50 underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              ))}
            </div>
            {item.editorialNote ? <p className="mt-3 text-xs leading-6 text-brand-cream/40">{item.editorialNote}</p> : null}
          </Card>
        ))}
      </div>
    </section>
  );
}

export default async function CuratedVideoLibraryPage() {
  await requireAdminPermission("video.manage");

  return (
    <Container className="space-y-12 py-10 text-right" dir="rtl">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-cream/35">ZIKR VIDEO CONTENT LIBRARY</p>
        <h1 className="text-3xl font-bold text-brand-gold md:text-4xl">مكتبة المحتوى الموثق لاستوديو الفيديو</h1>
        <p className="max-w-4xl leading-8 text-brand-cream/65">
          مكتبة منظمة للإنتاج: نصوص دينية مقفلة على مصادرها، وسلاسل قصص أطفال خيالية ذات حلقات وأهداف تعليمية وفئات عمرية واضحة، ورسائل عامة محررة. القصص الجديدة لا تُنسب إلى القرآن أو السنة أو الوقائع التاريخية.
        </p>
        <Link href="/admin/ai-video" className="inline-flex rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
          العودة إلى استوديو إنتاج الفيديو
        </Link>
      </header>

      <Section title="قصص موثقة" description="قصص من القرآن والسنة بصياغة تحريرية مختصرة، مع روابط المصدر الأساسي والمصادر الإضافية عند الحاجة." items={CURATED_STORY_SOURCES} />
      <Section title={`سلاسل قصص الأطفال — ${CURATED_KIDS_STORY_SOURCES.length} حلقة`} description="أربع سلاسل أصلية قابلة للاستكمال التلقائي بموسم جديد. كل حلقة لها رقم، هدف تربوي، فئة عمرية، ونسخة صوتية ودليل بصري مناسب للأطفال." items={CURATED_KIDS_STORY_SOURCES} />
      <Section title="الأذكار" description="أذكار مختارة مع المرجع والعدد عند وروده، ومنع خلط الفضائل أو الأعداد بين الروايات." items={CURATED_ADHKAR_SOURCES} />
      <Section title="رسائل عامة" description="رسائل توعوية قابلة للتحويل إلى فيديو، لكنها لا تُنسب إلى القرآن أو الحديث ولا تُعرض كفتوى." items={CURATED_GENERAL_MESSAGES} />
    </Container>
  );
}

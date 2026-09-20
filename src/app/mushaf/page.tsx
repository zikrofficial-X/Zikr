import type { Metadata } from "next";
import Link from "next/link";
import { QuranCatalogPage } from "@/features/quran/components/quran-catalog-page";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "المصحف الشريف | ذِكرٌ",
  description:
    "المصحف الشريف كاملًا: 114 سورة و6236 آية، مع تصفح السور والتفسير والتلاوات.",
  path: "/mushaf",
});

export default function MushafPage() {
  return (
    <main dir="rtl" className="min-h-screen">
      <section className="border-b border-brand-gold/15 bg-gradient-to-b from-[#071A13] to-transparent py-10">
        <div className="mx-auto max-w-5xl space-y-4 px-4 text-center">
          <p className="text-sm tracking-[0.25em] text-brand-gold/70">المصحف الشريف</p>
          <h1 className="font-arabic text-4xl font-bold text-brand-gold md:text-5xl">
            ﴿ كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ ﴾
          </h1>
          <p className="mx-auto max-w-2xl leading-8 text-brand-cream/70">
            اقرأ كتاب الله كاملًا من نسخة القرآن المحلية المحفوظة ضمن مستودع ذِكرٌ، وتصفح السور والآيات بتصميم هادئ قريب من صفحات المصحف، مع إمكانية الانتقال إلى التفسير والتلاوة.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="rounded-full border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-brand-gold">114 سورة</span>
            <span className="rounded-full border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-brand-gold">6236 آية</span>
            <Link
              href="/quran"
              className="rounded-full border border-brand-cream/15 px-4 py-2 text-brand-cream/70 transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
            >
              واجهة السور والتلاوة
            </Link>
          </div>
        </div>
      </section>

      <QuranCatalogPage showHeader={false} />

      <p className="mx-auto max-w-5xl px-4 pb-10 text-center text-xs leading-6 text-brand-cream/45">
        نص القرآن الكريم محفوظ محليًا ضمن المستودع مع إبقاء بيانات المصدر والترخيص. لا يُعد هذا بديلًا عن المراجعة بالمصحف المطبوع. للمراجعة والتدبر، يُرجى الرجوع إلى المصحف المطبوع وأهل الاختصاص.
      </p>
    </main>
  );
}

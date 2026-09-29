import { ContentGuide } from "@/components/content/content-guide";
import type { Metadata } from "next";
import { QuranCatalogPage } from "@/features/quran/components/quran-catalog-page";
import { pageMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "القرآن الكريم",
  description:
    "اقرأ واستمع إلى القرآن الكريم كاملاً: 114 سورة مع التفسير والتلاوات الصوتية بأصوات كبار القراء.",
  path: "/quran",
});

export default function QuranPage() {
  return (
    <>
      <QuranCatalogPage />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="دليل القراءة والاستماع في القرآن الكريم"
          intro="هذه الصفحة هي بوابة فهرس المصحف داخل ذِكر. اختر السورة للقراءة، واستخدم البحث والعودة إلى القراءة السابقة عندما تكون الميزة متاحة."
          items={[
            "الفهرس مبني على السور الـ114، مع بيانات السورة وعدد آياتها ونوع نزولها بحسب قاعدة المحتوى.",
            "يمكن الانتقال من فهرس السور إلى صفحة السورة ثم إلى الآية والتفسير عند توفره.",
            "ميزة متابعة القراءة تحفظ نقطة الاستكمال للمستخدم عندما تكون خدمة Supabase مهيأة.",
            "التلاوات الصوتية والتفسير منفصلان عن نص المصحف، لذلك يمكن استخدام القراءة النصية حتى عند تعذر مصدر صوتي.",
          ]}
          links={[
            { label: "القرآن — نص واستماع", href: "https://quran.com/" },
            { label: "سورة الأحزاب 41–42 — مثال على الإحالة القرآنية", href: "https://quran.com/33/41-42" },
          ]}
          note="الصفحة لا تعطي ترتيبًا تفضيليًا للسور أو القراء. المحتوى الديني الأساسي يُعرض من المصادر المهيأة داخل المشروع، مع روابط خارجية للرجوع فقط."
        />
      </div>
    </>
  );
}

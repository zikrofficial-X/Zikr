import { ContentGuide } from "@/components/content/content-guide";
import { getTafsirSourcesFromDb } from '@/features/quran/services/quran-server';
import TafsirLibrary from '@/features/quran/components/tafsir-library';
import { pageMetadata } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: 'تفسير القرآن الكريم',
  description: 'مصادر التفسير المتاحة فعليًا داخل خدمة القرآن في منصة ذِكر.',
  path: '/tafsir',
});

export default async function TafsirPage() {
  const sources = await getTafsirSourcesFromDb();
  return (
    <>
      <TafsirLibrary sources={sources} />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="كيف نقرأ التفسير؟"
          intro="صفحة التفسير تفصل بين نص القرآن وبين مصادر الشرح والتفسير المتاحة داخل قاعدة المحتوى، حتى يعرف القارئ طبيعة المادة التي يقرأها."
          items={[
            "التفسير شرح لمعاني الآيات وسياقاتها، وليس نصًا قرآنيًا بديلًا عن الآية الأصلية.",
            "المصادر الظاهرة هنا هي المصادر المتاحة فعليًا في قاعدة بيانات ذِكر، وليست قائمة شاملة بكل كتب التفسير.",
            "عند نقل معنى أو حكم من تفسير، راجع اسم المصدر والآية المقصودة قبل الاعتماد عليه في بحث تفصيلي.",
            "يمكن الانتقال من المصحف إلى صفحة الآية ثم إلى التفسير لتقليل الالتباس بين النص القرآني والشرح.",
          ]}
          links={[
            { label: "المصحف", href: "/quran" },
            { label: "مركز المعرفة", href: "/knowledge" },
          ]}
          note="المنصة تعرض المادة التعليمية كما هي محفوظة في قاعدة المحتوى، وتحتاج الأسئلة المتخصصة في التفسير والفقه إلى الرجوع لأهل العلم والمصادر المعتمدة."
        />
      </div>
    </>
  );
}

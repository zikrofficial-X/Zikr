import { ContentGuide } from "@/components/content/content-guide";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { getAllScholars } from "@/features/scholars/services/scholars";
import ScholarsPageView from "@/features/scholars/components/scholars-page";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "العلماء والدعاة",
  description: "تعرف على أبرز علماء الإسلام مع بيانات تعريفية ومصادر وروابط يمكن الرجوع إليها.",
  path: "/scholars",
});

export default async function ScholarsPage() {
  const scholars = await getAllScholars();
  return (
    <>
      <ScholarsPageView scholars={scholars} />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="منهجية صفحة العلماء والدعاة"
          intro="تعرض الصفحة ملفات الشخصيات الموجودة فعليًا في قاعدة المحتوى، وتتيح البحث والتصفية دون تحويل النتائج إلى ترتيب تفضيلي."
          items={[
            "الملف التعريفي يعتمد على البيانات المنشورة في قاعدة المحتوى: الاسم والسيرة والتصنيف والمجال والمصادر عند توفرها.",
            "غياب السيرة أو المصدر لا يعني أن الشخصية غير مهمة؛ يعني فقط أن البيانات المنشورة في المنصة ما زالت محدودة.",
            "يُفضَّل الرجوع إلى المصادر الأصلية أو المواقع الرسمية للشيخ أو المؤسسة عند الحاجة إلى معلومات تفصيلية أو أحدث.",
            "صفحة العلماء ليست فتوى ولا تصنيفًا للعلماء، وهي أداة فهرسة للمحتوى المنشور في ذِكر.",
          ]}
          links={[
            { label: "مركز المعرفة", href: "/knowledge" },
            { label: "سياسة التحرير والمصادر", href: "/editorial-policy" },
          ]}
          note="عند اختلاف المعلومات بين المصادر، يجب الرجوع إلى المصدر الأصلي وتحديد تاريخ المعلومة بدل عرضها كحقيقة غير قابلة للتغير."
        />
      </div>
    </>
  );
}

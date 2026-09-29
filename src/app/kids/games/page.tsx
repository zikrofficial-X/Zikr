import { ContentGuide } from "@/components/content/content-guide";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import KidsGamesIndex from "@/features/kids/components/games/games-index";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "عالم ذِكر للأطفال | الألعاب",
  description: "ألعاب تعليمية آمنة وأصلية للأطفال ضمن عالم ذِكر.",
  path: "/kids/games",
});

export default function KidsGamesPage() {
  return (
    <>
      <KidsGamesIndex />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="دليل الألعاب التعليمية"
          intro="ألعاب قسم الأطفال مصممة لتقسيم التعلم إلى خطوات قصيرة: سؤال، اختيار، ترتيب، تكرار أو نشاط قصصي."
          items={[
            "كل لعبة يجب أن توضح هدفها قبل البدء حتى يعرف الطفل ما الذي يتدرب عليه.",
            "النتيجة تستخدم لتوجيه التقدم والشارات داخل عالم ذِكر، وليست اختبارًا مدرسيًا رسميًا.",
            "يفضل للوالدين مراجعة اللعبة أول مرة والتأكد من أنها مناسبة لعمر الطفل ومستوى فهمه.",
            "عند عدم توفر بيانات اللعبة، تعرض الصفحة حالة عدم التوفر بدل إنشاء أسئلة أو مصادر غير موثقة.",
          ]}
          links={[{ label: "مغامرات الأطفال", href: "/kids/adventures" }, { label: "التقدم", href: "/kids/progress" }]}
          note="أولوية قسم الأطفال هي السلامة والوضوح والمحتوى الموثق؛ لا نستخدم محتوى تجريبيًا على أنه مادة تعليمية نهائية."
        />
      </div>
    </>
  );
}

import { ContentGuide } from "@/components/content/content-guide";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import KidsAchievementsBoard from '@/features/kids/components/kids-achievements-board';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata({
  title: 'إنجازات الأطفال | ذكر',
  description: 'نجوم وشارات ولوحة شرف محلية تشجع الأطفال على التعلم والذكر.',
  path: '/kids/achievements',
});

export default function KidsAchievementsPage() {
  return (
    <>
      <KidsAchievementsBoard />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="كيف تعمل إنجازات الأطفال؟"
          intro="لوحة الإنجازات تحول التعلم واللعب إلى أهداف صغيرة قابلة للمتابعة، مع نجوم وشارات بدل المقارنة بين الأطفال."
          items={[
            "النجوم والشارات مرتبطة بالأنشطة التي ينفذها الطفل داخل عالم ذِكر.",
            "التقدم الشخصي أهم من ترتيب الطفل على الآخرين؛ الهدف هو الاستمرار والتعلم.",
            "قد تظهر بعض الإنجازات بعد اكتمال نشاط أو تسجيل صوتي أو لعب لعبة تدعم هذه الميزة.",
            "الإنجازات ليست شهادة علمية أو حكمًا على مستوى الطفل، بل مؤشر تحفيزي داخل التطبيق.",
          ]}
          links={[{ label: "عالم الأطفال", href: "/kids" }, { label: "متابعة التقدم", href: "/kids/progress" }]}
          note="يفضل أن يراجع ولي الأمر المحتوى المناسب لعمر الطفل وأن يستخدم الإنجازات كوسيلة تشجيع لا كضغط."
        />
      </div>
    </>
  );
}

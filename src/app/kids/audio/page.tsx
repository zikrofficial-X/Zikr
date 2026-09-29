import { ContentGuide } from "@/components/content/content-guide";
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site';
import KidsAudioHub from '@/features/kids/components/kids-audio-hub';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata({
  title: 'صوتيات الأطفال | ذكر',
  description: 'قصص وأناشيد وأذكار صوتية للأطفال مع تسجيل محلي آمن.',
  path: '/kids/audio',
});

export default function KidsAudioPage() {
  return (
    <>
      <KidsAudioHub />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="مكتبة صوتيات الأطفال"
          intro="مساحة مخصصة للقصص والأناشيد والأذكار الصوتية المناسبة للأنشطة التعليمية في قسم الأطفال."
          items={[
            "يمكن تشغيل المادة الصوتية أثناء النشاط أو الاستماع المنفصل دون الحاجة إلى فتح صفحة اللعبة نفسها.",
            "تسجيلات الطفل، عندما تكون الميزة متاحة، موجهة للتدريب والمتابعة وليست منشورة للعامة تلقائيًا.",
            "يفضل استخدام الصوتيات كجزء من نشاط قصير ومتكرر بدل تشغيل المحتوى بلا هدف تعليمي.",
            "توفر الصوتيات يعتمد على الأصول الصوتية التي تم اعتمادها وإضافتها إلى قاعدة المحتوى.",
          ]}
          links={[{ label: "ألعاب الأطفال", href: "/kids/games" }, { label: "مغامرات ذِكر", href: "/kids/adventures" }]}
          note="لا نضيف مواد صوتية غير موثقة إلى المكتبة. عند غياب أصل صوتي معتمد، تعرض الواجهة حالة عدم التوفر بدل رابط وهمي."
        />
      </div>
    </>
  );
}

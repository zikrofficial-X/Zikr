'use client';

import { ContentGuide } from "@/components/content/content-guide";

import { TasbeehPage } from '@/features/tasbeeh/components/tasbeeh-page';

export default function Page() {
  return (
    <>
      <TasbeehPage />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="استخدام المسبحة الإلكترونية"
          intro="المسبحة أداة للعد والمراجعة اليومية، وليست مرجعًا يحدد عددًا شرعيًا من تلقاء نفسه."
          items={[
            "اختر الذكر والعدد المستهدف وفق المحتوى الموثق أو العادة التي تريد متابعتها.",
            "استخدم العدّاد كوسيلة مساعدة على التركيز، مع إمكانية إعادة ضبط الجولة وبدء جلسة جديدة.",
            "لا تُبنى فضيلة الذكر في المنصة على الرقم وحده؛ النص والمصدر هما الأساس عند ذكر فضيلة مخصوصة.",
            "يمكن دمج المسبحة مع الأذكار اليومية أو بعد الصلاة بدل استخدامها كصفحة منفصلة بلا سياق.",
          ]}
          links={[
            { label: "الأذكار", href: "/adhkar" },
            { label: "القرآن", href: "/quran" },
          ]}
          note="هذه الصفحة أداة تقنية للعد. أي نص يذكر فضلًا خاصًا أو عددًا محددًا يحتاج إلى مصدر ديني واضح."
        />
      </div>
    </>
  );
}

import { ContentGuide } from "@/components/content/content-guide";
import { pageMetadata } from '@/lib/site';
import type { Metadata } from 'next';
import OfflineLibraryClient from './offline-library-client';

export const metadata: Metadata = pageMetadata({
  title: 'مكتبة ذِكر الأوفلاين',
  description:
    'مكتبة ذِكر الأوفلاين للمحتويات العامة المتاحة بدون اتصال بالإنترنت مع دعم PWA وCache Storage وIndexedDB.',
  path: '/offline-library',
});

export default function OfflineLibraryPage() {
  return (
    <>
      <OfflineLibraryClient />
      <div className="container mx-auto px-4 pb-12">
        <ContentGuide
          title="ما الذي يعنيه العمل بدون اتصال؟"
          intro="مكتبة الأوفلاين تعرض فقط الأصول التي صممت المنصة لتخزينها محليًا، مع الاعتماد على PWA وCache Storage وIndexedDB حسب نوع المحتوى."
          items={[
            "الأوفلاين لا يعني أن كل بيانات الحساب أو كل الوسائط الخارجية ستعمل بلا إنترنت.",
            "المحتويات الشخصية والبيانات التي تحتاج جلسة مستخدم أو خدمة خارجية قد تتطلب اتصالًا عند فتحها.",
            "يمكن استخدام صفحة الأوفلاين للتأكد مما تم تخزينه محليًا بدل افتراض أن كل الصفحات قابلة للعمل دون اتصال.",
            "عند إضافة محتوى جديد، يجب أن يمر عبر فحص الأصول والأوفلاين قبل اعتباره متاحًا دون شبكة.",
          ]}
          links={[
            { label: "القرآن", href: "/quran" },
            { label: "المكتبة", href: "/library" },
            { label: "دليل المنصة", href: "/platform" },
          ]}
          note="لا نعرض روابط خارجية على أنها موارد أوفلاين. إذا كان المورد يعتمد على CDN أو API خارجيًا، تبقى حالته واضحة للمستخدم."
        />
      </div>
    </>
  );
}

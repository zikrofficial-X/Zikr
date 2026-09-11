# ZIKR v1.4.5

## الإصلاحات والتحديثات

- مزامنة migration الخاصة بتقوية مزامنة الفيديوهات والتنظيف مع سجل Supabase الإنتاجي.
- حماية جدول حدود الإدارة من وصول أدوار العميل.
- نقل جدولة تنظيف الوسائط إلى Supabase Cron مع استدعاء Edge Function.
- تحسين sitemap ليعمل ديناميكيًا مع cache داخلي وتجنب تحذيرات static generation غير الصحيحة.
- تحديث توثيق ربط GitHub وVercel وSupabase إلى المستودع الصحيح.
- رفع Android `versionCode` إلى `36` و`versionName` إلى `1.4.5`.

## التحقق

تم اجتياز فحص TypeScript وESLint والاختبارات وبناء Next.js، كما اجتاز replay المحلي لجميع migrations وفحص المسارات وتكامل المشروع. تم التحقق من الإنتاج عبر الصفحة الرئيسية و`robots.txt` و`sitemap.xml` و`/api/health`.

## ملاحظات خارجية

يبقى تفعيل حماية كلمات المرور المسرّبة في Supabase إعدادًا من لوحة Authentication وليس migration SQL. كما أن نشر Vercel التلقائي يتطلب أن يكون Vercel GitHub App مرتبطًا بالمستودع `Zikrmediaofficial/Zikr`.

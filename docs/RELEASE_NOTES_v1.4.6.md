# ZIKR v1.4.6

## الإصدار

- توحيد عنوان الإنتاج على `https://zikrmediaofficial.vercel.app/`.
- إصلاح Google OAuth على Android باستخدام `com.zikr.app://auth/callback` مع الحفاظ على PKCE داخل التطبيق.
- تثبيت مسار فيديوهات القرآن المجاني على template generator مع التلاوة الأصلية والترميز الاحترافي عبر FFmpeg.
- فصل تعطل النشر الاجتماعي عن توليد الفيديوهات، مع إبقاء النشر الاجتماعي معطلًا لحين تحديث الاعتمادات المنتهية.
- تحديث Android `versionCode` إلى `37` و`versionName` إلى `1.4.6`.
- توحيد فحص metadata مع الإصدار الجديد.

## OAuth / Android

- Application ID: `com.zikr.app`
- Native callback: `com.zikr.app://auth/callback`
- Production callback: `https://zikrmediaofficial.vercel.app/auth/callback`

## التحقق قبل اعتماد الإصدار

- Supabase Authentication → URL Configuration: ضبط Site URL على نطاق الإنتاج وإضافة callback الخاص بالموقع وdeep link الخاص بالتطبيق.
- Google Cloud OAuth: استخدام عنوان Supabase provider callback كـ Authorized redirect URI.
- تشغيل `pnpm verify`.
- التحقق من توقيع APK وAAB ومن `applicationId` و`versionName` و`targetSdk`.

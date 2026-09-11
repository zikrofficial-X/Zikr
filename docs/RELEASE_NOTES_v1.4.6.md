# ZIKR v1.4.6

## الإصدار

- تثبيت `NEXT_PUBLIC_SITE_URL` على نطاق الإنتاج الرسمي: `https://zikrmediaofficial.vercel.app/`.
- إصلاح Google OAuth للـAndroid باستخدام deep link مباشر: `com.zikr.app://auth/callback` مع الحفاظ على PKCE داخل التطبيق.
- إبقاء Google callback الإنتاجي على `/auth/callback` وعدم استخدام روابط Vercel preview المتغيرة في مسار الإنتاج.
- تثبيت مسار فيديوهات القرآن المجاني على template generator مع تلاوة القرآن الأصلية وFFmpeg والترميز الاحترافي.
- فصل فشل النشر الاجتماعي عن توليد الفيديوهات مع إبقاء النشر الاجتماعي معطلًا حتى تحديث بيانات الاعتماد المنتهية.
- تحديث Android `versionCode` إلى `37` و`versionName` إلى `1.4.6`.
- توحيد `package.json` وإجراءات التحقق مع الإصدار الجديد.

## OAuth / Android

- Application ID: `com.zikr.app`
- Native callback: `com.zikr.app://auth/callback`
- Production callback: `https://zikrmediaofficial.vercel.app/auth/callback`

## التحقق المطلوب قبل النشر

- Supabase Authentication → URL Configuration: ضبط Site URL على نطاق الإنتاج الرسمي وإضافة callback الخاص بالموقع وdeep link الخاص بالتطبيق.
- Google Cloud OAuth: الاحتفاظ بعنوان Supabase provider callback كعنوان Authorized redirect URI.
- تشغيل `pnpm verify` قبل اعتماد الإصدار النهائي.
- التحقق من توقيع APK وAAB ومن `applicationId` و`versionName` و`targetSdk`.

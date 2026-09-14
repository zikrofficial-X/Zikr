# ZIKR v1.4.22 — إصلاح تسجيل الدخول عبر Google على Android

## الإصلاح

يعالج هذا الإصدار مشكلة كانت تجعل تسجيل الدخول عبر Google يفتح الحساب في المتصفح ثم لا يعيد المستخدم إلى تطبيق Android. أصبح native OAuth يستخدم إعادة توجيه مباشرة إلى:

`com.zikr.app://auth/callback`

بعد عودة Google، يستقبل Capacitor الرابط عبر `appUrlOpen`، ويجري تبادل رمز PKCE داخل WebView نفسها، ثم يغلق نافذة المتصفح وينقل المستخدم إلى الصفحة المطلوبة داخل التطبيق. بقي callback الويب `https://zikrmediaofficial.vercel.app/auth/callback` فعالًا للويب وللتوافق مع الإصدارات القديمة.

## الإصدار

- **Version name:** `1.4.22`
- **Version code:** `53`
- **Package:** `com.zikr.app`
- **Source commit:** سيتم تثبيته في tag `v1.4.22`

## التحقق

| الفحص | النتيجة |
|---|---|
| TypeScript | ناجح |
| ESLint | ناجح |
| الاختبارات | ناجحة |
| Mobile readiness | ناجح |
| Next.js production build | ناجح |
| Capacitor Android sync | ناجح |
| Gradle debug APK | ناجح |
| Gradle release APK | ناجح، غير موقّع |
| Gradle release AAB | ناجح، غير موقّع |
| Android package identity | ناجح: `com.zikr.app` |
| Native callback handler | موجود ويستخدم `appUrlOpen` و`getLaunchUrl` وPKCE exchange |

## ملاحظة التكوين المطلوبة

يجب أن يكون الرابط التالي مضافًا إلى Supabase Auth URL Configuration حتى يسمح Supabase بإعادة التوجيه إلى التطبيق:

`com.zikr.app://auth/callback`

ويجب أن يبقى الرابط التالي لتسجيل الدخول عبر الويب:

`https://zikrmediaofficial.vercel.app/auth/callback`

## التوقيع

ملف debug موقّع بتوقيع Android Debug ومخصص للاختبار. ملفات release مبنية بنجاح لكنها غير موقعة لعدم توفر production keystore الأصلي؛ لا ترفعها إلى Google Play قبل توقيعها بالمفتاح الأصلي.

## ملفات الإصدار

| الملف | الحالة | الحجم | SHA-256 |
|---|---|---:|---|
| `zikr-v1.4.22-oauth-fix-debug.apk` | موقّع Debug للاختبار | 37,372,556 bytes | `6870c27344ab71fc126cf19617a16c85ebda0561bcd5a955c0c2eabca524d1b7` |
| `zikr-v1.4.22-oauth-fix-release-unsigned.apk` | Release غير موقّع | 34,779,368 bytes | `d0e1488d6151e034583544765d3b4369fcc77ee4ea928a9e13cde9475acc3c43` |
| `zikr-v1.4.22-oauth-fix-release-unsigned.aab` | Release غير موقّع | 29,775,321 bytes | `913171dacc8f29034ba947be7a923618c3040b426e5ba7f446ba13f82c53b09e` |

لا يُسمح باستخدام debug APK في الإنتاج.

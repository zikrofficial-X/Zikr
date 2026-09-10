# ZIKR v1.4.4

## إصلاح Google OAuth في Android

يعيد التطبيق الآن نتيجة Google OAuth من جسر HTTPS الإنتاجي إلى `com.zikr.app://auth/callback`، ثم يستبدل كود PKCE داخل WebView التطبيق ويغلق المتصفح الخارجي بعد نجاح المصادقة. كما تمت إضافة معالجة callback عند تشغيل التطبيق واستئنافه، مع توافق مع تدفقات الإصدارات السابقة.

## التحقق

نجحت فحوصات TypeScript وESLint والاختبارات وبناء Next.js وفحص جاهزية الهاتف. يحتوي إصدار Android على `versionCode=35`.

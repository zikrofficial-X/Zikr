# خطة تقوية أمان ZIKR وتجهيز APK وGitHub Release

## الهدف
تقوية مشروع ZIKR عمليًا ضد كشف الأسرار، الوصول غير المصرح، التخريب، التعديلات الخبيثة، اختراق CI/CD، وتسريب بيانات Supabase، ثم تجهيز APK/AAB وGitHub Release وخيار تنزيل رسمي من الموقع. ستبدأ العملية باختبار شامل قبل أي تغيير، ثم إصلاح الجوانب القابلة للإصلاح، ثم إعادة الاختبار من حالة نظيفة.

## الحدود الأمنية
لا يمكن جعل مستودع خاص أو APK غير قابل للنسخ أو الهندسة العكسية بشكل مطلق. يمكن منع الوصول غير المصرح، إبطال الأسرار، حماية الفروع، منع تشغيل الأسرار على PR غير موثوق، إبقاء الصلاحيات الحساسة على الخادم، وتقليل تحليل APK عبر R8 والتوقيع وPlay Integrity. سيذكر التقرير ما تم إثباته ولا سيصف الحماية بأنها مطلقة.

## المرحلة 1: خط أساس واختبارات قراءة فقط
1. جرد المستودع، الفروع، tags، releases، workflow، Vercel، Capacitor، Android/iOS، Supabase، routes، auth، PWA، الصوت والإشعارات.
2. تشغيل `pnpm install --frozen-lockfile` و`pnpm verify` وroutes/sitemap/production smoke وmobile readiness.
3. تشغيل فحص secret patterns في الشجرة والتاريخ والملفات المولدة دون طباعة القيم. استخدام GitHub secret/code/dependency APIs إذا سمحت الصلاحيات، وتسجيل 403 كعدم قابلية تحقق وليس كدليل خلو من المخاطر.
4. اختبار Supabase بقراءات محدودة فقط، وفحص migrations/schema/RLS/Storage/triggers/indexes. منع POST/UPDATE/DELETE العشوائي.
5. اختبار Capacitor وGradle من مجلد Android الصحيح. تشغيل `cap sync` وبناء native فقط بعد اعتماد مرحلة التنفيذ، لأنه يولد ملفات ويغير شجرة العمل.
6. اختبار الإنتاج ومسارات API والمصادقة والـ redirects والـ headers وhealth endpoint.

## المرحلة 2: تقوية GitHub وCI/CD
1. الحفاظ على `main` محميًا: PR إلزامي، فحص CI ناجح، منع force-push والحذف، strict checks، ومراجعة تغييرات auth/Supabase/Android/workflows.
2. إنشاء أو تقوية CODEOWNERS للمجلدات الحساسة، وSECURITY.md للإبلاغ المسؤول.
3. جعل workflows تستخدم أقل صلاحيات (`contents: read` افتراضيًا)، وعدم تمرير أسرار إلى fork PRs، وفصل verify عن preview عن production وعن Android release.
4. تثبيت actions بإصدارات immutable قدر الإمكان، وإضافة timeouts وconcurrency ومنع shell injection من inputs.
5. إضافة secret scanning/push protection وDependabot/dependency review وCodeQL حيث تسمح صلاحيات GitHub. عدم تعطيل فحص مطلوب بسبب rate limit.
6. استخدام GitHub Environments للإنتاج وAndroid release مع approval/restricted branches عند توفرها.

## المرحلة 3: تقوية التطبيق والخادم
1. فصل PUBLIC عن SERVER-ONLY في `.env.example` وVercel/Supabase/GitHub secrets، ومنع service-role وOAuth client secrets وsigning credentials من client bundle وAPK.
2. مراجعة RLS وStorage policies وServer Actions وAPI routes وadmin authorization ضد IDOR وcross-user access.
3. فحص open redirects وXSS/unsafe HTML وSSRF وpath traversal وfile upload وSQL/command injection وCORS/CSRF وrate limiting.
4. تقوية security headers وCSP المتوافق مع Supabase وOAuth وCapacitor، وcookies/session وlogout/refresh وOAuth state.
5. عدم تغيير أو تدوير credential حقيقي إلا بعد تحديد أنه مكشوف وتوفر صلاحية آمنة؛ عند الحاجة يُسجل كإجراء حساب مالك.
6. مراجعة Vercel environments، preview isolation، domains، deploy hooks، runtime logs، وعدم كشف أسرار الإنتاج في preview.

## المرحلة 4: Android وCapacitor
1. إصلاح الملفات المولدة عبر `pnpm build` ثم `pnpm exec cap sync android`، وبعدها بناء debug واختباره.
2. مراجعة package `com.zikr.app` وversionName/versionCode وcompile/target SDK، ورفع target SDK فقط إذا كانت نسخ AGP/Gradle/Java وCapacitor متوافقة، دون ترقيات عشوائية.
3. مراجعة Manifest والصلاحيات وApp Links وassetlinks وOAuth وWebView وcleartext/debug/backup والإشعارات والصوت.
4. فصل debug عن release، وتفعيل R8/ProGuard بحذر بعد اختبار الوظائف.
5. استخدام release keystore أو Play App Signing خارج GitHub. لا يُنشأ أو يُرفع keystore تخميني. استخراج SHA-256 الحقيقي من الشهادة وضبط App Links.
6. بناء APK release وAAB، فحص package/version/signature/permissions، وحساب SHA-256. اختبار clean install وupgrade وoffline وaudio وnotifications وdeep links وback button وbackground/foreground.

## المرحلة 5: Workflow وGitHub Release
1. إنشاء workflow tag-based يعمل فقط على tag منضبط مثل `v1.0.0` وبعد نجاح verify، ولا يستخدم أسرارًا على PRs.
2. تشغيل install frozen وtypecheck وlint وtests وweb build وCapacitor sync وAndroid lint/test وAAB/APK build.
3. رفع APK وAAB و`SHA256SUMS` وrelease notes إلى GitHub Release بصلاحية `contents: write` داخل job الإصدار فقط.
4. التحقق بعد الرفع من تنزيل artifact ومطابقة hash وفحص health/routes.
5. عدم اعتبار debug APK إصدارًا إنتاجيًا، وعدم الادعاء بإتمام Google Play submission دون Play Console.

## المرحلة 6: تنزيل APK من الموقع
إضافة بطاقة آمنة في الصفحة الرئيسية وصفحة المنصة تشير إلى GitHub Release الرسمي، وتعرض الإصدار والحجم وSHA-256 ومتطلبات Android وتحذير المصادر غير الرسمية. لا يُستخدم رابط APK متغير أو ملف غير موثق.

## المرحلة 7: الاختبارات النهائية

| المجال | معيار النجاح |
|---|---|
| Web | verify/build/routes/headers/production smoke بلا أخطاء معروفة |
| Supabase | migrations قابلة للإعادة، RLS تمنع cross-user، service-role server-only |
| GitHub | حماية main، CODEOWNERS، secret/dependency/code scans، أقل صلاحيات |
| CI/CD | لا أسرار على fork PR، release tag محمي، checks قبل النشر |
| Android | debug وrelease build وAAB ينجحان، package صحيح، لا crash |
| Signing | شهادة release محفوظة خارج Git، SHA-256 قابل للتحقق |
| OAuth | Web وAndroid deep-link/session/logout مجربة على جهاز أو emulator |
| Notifications | القنوات والصوت والتذكير وإعادة التشغيل مجربة ضمن حدود الجهاز |
| Offline | first online ثم offline وcache update وlogout/login سليمة |
| Release | GitHub Release وAPK/AAB وhash قابلة للتنزيل والتحقق |
| Google Play | بيانات المتجر وData Safety وPrivacy وtesting موثقة دون اختلاق |

## متطلبات بشرية/خارجية
قد يلزم من مالك الحساب توفير release keystore وalias/password، SHA-256، Apple Team ID، Google OAuth credentials، صلاحيات GitHub security APIs، إعدادات Vercel/Supabase، جهاز Android أو emulator، وحساب Google Play. ستُصنف هذه البنود صراحة إلى `COMPLETED`, `BLOCKED BY EXTERNAL ACCOUNT ACTION`, أو `REQUIRES USER INPUT`.

## مخرجات التقرير
تقرير قبل التنفيذ يوضح لكل اختبار الأمر والنتيجة PASS/FAIL/BLOCKED، السبب والخطورة. وبعد التنفيذ تقرير أمني يذكر الوضع قبل/بعد، الأسرار الموجودة أو التي تم تدويرها، إعدادات GitHub، RLS وVercel وAndroid، نتائج الاختبارات، artifacts، روابط الإنتاج وRelease، والمخاطر المتبقية. لا يتم إعلان «صفر أخطاء» إلا عند وجود أدلة قابلة لإعادة الإنتاج.

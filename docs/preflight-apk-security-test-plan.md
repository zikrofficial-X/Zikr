# خطة الاختبار الشامل قبل حماية وإصدار ZIKR

## الهدف
إجراء اختبار واقعي وشامل لمشروع ZIKR قبل تنفيذ تغييرات الحماية أو إصدار APK/AAB أو إنشاء GitHub Release. الغرض هو إنتاج مصفوفة أدلة تفصل بين الأجزاء الناجحة، الأعطال البرمجية القابلة للإصلاح، والمتطلبات الخارجية التي تحتاج بيانات أو صلاحيات من مالك الحساب.

## قاعدة التنفيذ
لن يتم تعديل الكود أو إعدادات GitHub/Supabase/Vercel، ولن يتم إنشاء Release عام أو تغيير branch protection أثناء مرحلة الاختبار. الاختبارات التي قد تنشئ بيانات أو تغيّر حالة خارجية، مثل POST على Supabase أو تسجيل مستخدم حقيقي، ستُمنع أو تُجرى فقط ببيانات اختبار مخصصة ومصرح بها. لن تُستخدم أسرار حقيقية داخل التقارير أو السجلات.

## النطاق ومراحل الاختبار

### 1. فحص المصدر والبنية
قراءة package.json وlockfile وNext.js وTypeScript وESLint وCapacitor وAndroid وiOS وSupabase وVercel وCI/CD. جرد الصفحات وAPI وServer Actions وmiddleware وService Worker وIndexedDB والأصول الصوتية وملفات الإصدار. البحث عن TODO/FIXME وplaceholders وdead code والتكوينات المتكررة والأسرار والاعتماديات القديمة.

### 2. اختبارات الويب والإنتاج
تشغيل install frozen وtypecheck وlint والاختبارات وproduction build وفحوصات routes وsitemap وrobots وmetadata. اختبار المسارات العامة والمحمية وواجهات الصحة والمحتوى وredirects على الإنتاج، مع التحقق من عدم وجود 4xx/5xx أو hydration/runtime errors في المسارات الحرجة.

### 3. اختبارات Supabase والمصادقة
تشغيل فحوص القراءة الآمنة بحدود صغيرة، والتحقق من migrations وschema وRLS وStorage وtriggers والفهارس والقيود. اختبار عدم وجود service-role key في client bundle أو APK. يمكن فحص سياسة الوصول، لكن لن تُجرى عمليات كتابة عشوائية. اختبار Web OAuth وsession persistence وlogout يحتاج جلسة اختبار صالحة؛ Android OAuth وdeep links يحتاج جهازًا أو emulator.

### 4. اختبارات Capacitor وAndroid وiOS
تشغيل mobile readiness وCapacitor CLI وGradle validation. تشغيل `cap sync` فقط بعد اعتماد التنفيذ لأنه يولد ويغير ملفات native. بعدها بناء debug APK أولًا، ثم اختبار release build وAAB دون نشر. مراجعة package ID وversionCode/versionName وtargetSdk والصلاحيات وManifest وApp Links وassetlinks والصوت والتنبيهات. إصدار iOS يحتاج macOS/Xcode وشهادة Apple ولا يمكن إثباته كاملًا في بيئة Linux.

### 5. اختبار التوقيع والإصدار
التحقق من وجود release keystore خارج Git، وضبط alias والبصمة SHA-256، ومنع طباعة كلمات المرور. تشغيل release readiness. إذا لم تتوفر keystore وبصمات Android أو Apple Team ID، تُسجل كمتطلبات خارجية ولا يتم اختلاقها. لا يعتبر APK debug بديلًا عن release موقّع.

### 6. تدقيق GitHub وCI/CD
فحص branch protection وrequired checks وworkflow triggers وpermissions وsecrets references وfork safety وactions versions وtimeouts وconcurrency. تشغيل verify على بيئة نظيفة. فحص secret scanning وCodeQL وDependabot إن سمحت صلاحيات GitHub؛ إذا أعاد API 403، يُسجل ذلك كعدم قابلية تحقق وليس كإثبات خلو من الثغرات. لا تُرفع ملفات توقيع ولا تُشغّل أسرار على Pull Requests غير موثوقة.

### 7. PWA والأوفلاين والإشعارات والصوت
اختبار first launch online وsubsequent offline وSlow 3G وintermittent network وcache invalidation وService Worker update وIndexedDB. اختبار أصول القرآن والأذكار والأدعية، وعدم تخزين بيانات auth الحساسة بشكل غير آمن. اختبار local notifications وpush configuration وchannels وsounds وtimezone وrestart، مع التمييز بين ما يمكن إثباته في CI وما يحتاج هاتفًا حقيقيًا.

### 8. الأمن والأداء
فحص build artifacts وclient bundles بحثًا عن secrets، وheaders وCSP وCORS وopen redirects وunsafe HTML ورفع الملفات وadmin authorization وrate limiting. قياس bundle size وroute response وqueries والكاش وWebView startup دون تغييرات عشوائية أو تعطيل أمان.

## مصفوفة النتائج

| المجال | دليل الاختبار المطلوب | معيار PASS |
|---|---|---|
| Web | verify/build/routes/production smoke | لا فشل أو runtime error معروف |
| Supabase | migrations/public reads/RLS review | schema متزامن وRLS يمنع cross-user |
| OAuth | Web وAndroid session flow | callback وsession وlogout تعمل |
| Android | sync/debug/release/AAB | build ناجح، package صحيح |
| Signing | keystore/fingerprint | توقيع release قابل للتحقق |
| CI/CD | workflow checks/security | أقل صلاحيات ولا أسرار في PR غير موثوق |
| Offline | SW/IndexedDB/slow network | تشغيل offline وتحديث cache صحيح |
| Notifications | channels/sound/restart | التذكير يعمل ضمن حدود الجهاز |
| Security | bundle/history/headers/auth | لا أسرار أو مسارات غير محمية |
| Play | listing/data safety/testing | جاهزية موثقة دون ادعاء نشر أو مراجعة |

## نتائج أولية معروفة قبل إعادة الاختبار
الويب و`pnpm verify` كانا ناجحين سابقًا، و`pnpm mobile:check` الأساسي ناجح. فحص release الصارم يحتاج `ANDROID_APP_LINKS_SHA256` و`IOS_ASSOCIATED_DOMAIN_APP_ID`. بناء Gradle السابق فشل لأن مجلد Capacitor المولد `android/capacitor-cordova-android-plugins` غير موجود، ما يعني أن `cap sync android` مطلوب قبل البناء. لا توجد GitHub Releases أو tags أو APK منشور، ورابط التنزيل غير موجود بعد. هذه البنود ستُعاد مطابقتها في الاختبار الحالي قبل أي إصلاح.

## المخرجات قبل التنفيذ
سيتم إعداد تقرير تفصيلي PASS/FAIL/BLOCKED لكل اختبار، مع الأمر المستخدم، النتيجة الفعلية، السبب الجذري إن أمكن، مستوى الخطورة، وما إذا كان يحتاج تعديلًا برمجيًا أو إجراءً خارجيًا. بعد تسليم التقرير لن يبدأ الإصلاح أو البناء release أو إنشاء GitHub Release إلا بعد اعتماد خطة التنفيذ المناسبة.

## حدود لا يمكن تجاوزها
لا يمكن ضمان أن APK غير قابل للنسخ أو الهندسة العكسية بالكامل. يمكن حماية الأسرار والخادم والبيانات، وتقليل الهندسة العكسية عبر R8 والتوقيع وPlay Integrity، وكشف العبث، لكن النسخة الموزعة قد تُنسخ. كما لا يمكن إثبات إشعارات الخلفية وOAuth على كل أجهزة Android من دون أجهزة فعلية أو emulator مناسب، ولا يمكن إكمال Google Play submission دون حساب المطور وبيانات المتجر والتوقيع.

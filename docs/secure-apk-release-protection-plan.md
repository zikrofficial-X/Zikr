# خطة حماية ZIKR وإطلاقه كتطبيق APK

## الهدف
تجهيز ZIKR كتطبيق Android قابل للتثبيت، إنشاء GitHub Release رسمي، إضافة تنزيل APK من الموقع، وتقوية حماية المستودع وعمليات CI/CD والواجهة الخلفية والتطبيق ضد التسريب والتخريب وسوء الاستخدام.

## حد أمني يجب توضيحه
لا يمكن جعل APK غير قابل للنسخ أو منع استخراج كل كود يصل إلى جهاز المستخدم بنسبة 100%. يمكن نسخ ملف APK وإجراء هندسة عكسية جزئية لأي تطبيق موزع. الهدف الواقعي هو منع كشف الأسرار، منع الكتابة غير المصرح بها، تقليل الهندسة العكسية، كشف العبث، وحماية البيانات والخدمات حتى عند امتلاك شخص نسخة من التطبيق.

## المرحلة الأولى: تدقيق المستودع
1. فحص Git history وbranches وtags وPull Requests بحثًا عن مفاتيح Supabase service-role وCloudinary وOAuth وVercel وأي أسرار.
2. تدوير وإبطال أي secret مكشوف، وعدم طباعة القيم أثناء الفحص.
3. مراجعة `.gitignore` لمنع keystore و`local.properties` و`.env*` وملفات التوقيع وartifacts.
4. تشغيل TypeScript وESLint والاختبارات وmigration replay وroutes audit وmobile readiness قبل أي إصدار.
5. تفعيل Dependabot وsecret scanning وCodeQL أو بديل متاح، ووضع سياسة أمنية للإبلاغ عن الثغرات.

## المرحلة الثانية: حماية GitHub
1. إبقاء `main` محميًا مع Pull Request إلزامي، ومنع force-push والحذف، واشتراط فحص `ci/circleci: verify` وفحوصات النشر الناجحة.
2. تقييد GitHub Actions إلى أقل صلاحيات ممكنة (`contents: read` افتراضيًا، و`contents: write` فقط في job إنشاء Release).
3. منع تشغيل أسرار الإصدار على Pull Requests من forks، واستخدام شروط tag موثوق وbranch محمي.
4. تثبيت إصدارات actions بالـ commit SHA متى أمكن، ومنع workflow غير موثوق من تعديل المستودع أو النشر.
5. إضافة CODEOWNERS للمجلدات الحساسة مثل `.github` و`supabase` و`android` وملفات auth، واشتراط مراجعة مالك الكود.

## المرحلة الثالثة: حماية backend والبيانات
1. إبقاء كل مفاتيح service-role وCloudinary وOAuth وعمليات الإدارة على الخادم فقط، وعدم تضمينها في Next.js client bundle أو APK.
2. مراجعة RLS لكل الجداول، وسياسات Storage، وصلاحيات admin وServer Actions وAPI routes، مع اختبارات cross-user وprivilege escalation.
3. إضافة validation للمدخلات، rate limiting للـ auth ورفع الملفات وAI وعمليات الإدارة، وتسجيل آمن لا يحتوي tokens أو بيانات حساسة.
4. استخدام cookies/session آمنة، منع open redirects، والتحقق من Origin/CSRF عند العمليات الحساسة.
5. عدم الاعتماد على حماية APK لإخفاء صلاحيات؛ الخادم هو مصدر القرار النهائي دائمًا.

## المرحلة الرابعة: بناء APK وتوقيعه
1. تدقيق Capacitor وAndroid Manifest وdeep links وApp Links وOAuth والصلاحيات والأصول الصوتية.
2. فصل `debug` عن `release`، وضبط versionName/versionCode، وتفعيل R8/ProGuard وresource shrinking بحذر بعد اختبار الوظائف.
3. استخدام release keystore حقيقي محفوظ خارج GitHub أو Android Play App Signing عند النشر في المتجر. لا يتم إنشاء keystore أو كلمة مرور تخمينية.
4. تخزين بيانات التوقيع في GitHub encrypted secrets أو بيئة توقيع خارجية، وعدم عرضها في logs أو artifacts.
5. فحص APK النهائي للصلاحيات والـ manifests ووجود أي URL أو secret غير مسموح، ثم حساب SHA-256.
6. يمكن إضافة Play Integrity عند النشر عبر Google Play، وruntime tamper signals، مع اعتبارها إشارات دفاعية لا ضمانًا مطلقًا.

## المرحلة الخامسة: Workflow الإصدار
1. إنشاء workflow يعمل عند tag مطابق للنمط `v*.*.*` فقط وبعد نجاح verify.
2. تشغيل install frozen، typecheck، lint، tests، build، Capacitor sync، Gradle release build، ثم فحص APK.
3. إنشاء `SHA256SUMS` وملف release notes، ورفع APK وhash فقط إلى GitHub Release.
4. ضبط concurrency لمنع إصدارات متزامنة، وpermissions صريحة، وtimeouts، وحفظ logs دون أسرار.
5. عدم السماح لفشل Vercel الخارجي أو rate limit بإخفاء فشل build حقيقي؛ يظل الدمج محكومًا بالفحص الفعلي المطلوب.
6. إضافة workflow تحقق بعد الإصدار ينزّل APK، يقارن hash، ويفحص endpoint الصحة والمسارات الأساسية.

## المرحلة السادسة: تنزيل APK من الموقع
1. إضافة بطاقة تنزيل في homepage وصفحة platform تشير إلى GitHub Release الرسمي فقط.
2. عرض version، تاريخ الإصدار، حجم الملف، SHA-256، ومتطلبات Android.
3. إضافة تحذير واضح من تنزيل APK من مصادر غير رسمية ومنح إذن التثبيت من مصدر خارجي عند الحاجة.
4. جعل الرابط ثابتًا وآمنًا وقابلًا للتحديث مع كل Release، دون استضافة ملف مجهول أو استخدام redirect غير موثوق.

## المرحلة السابعة: اختبارات الإطلاق

| المجال | معيار النجاح |
|---|---|
| المستودع | لا توجد أسرار أو مفاتيح توقيع في Git history أو artifacts |
| CI | verify وsecurity scans وbuild تعمل، ولا تستخدم أسرارًا في PR غير موثوق |
| APK | يثبت ويفتح دون crash، وتعمل الروابط والصوت والتذكيرات والأوفلاين |
| OAuth | تسجيل الدخول والعودة عبر HTTPS وdeep link يعملان |
| backend | RLS تمنع cross-user access، وadmin authorization خادمي |
| التوقيع | APK release موقّع، والـ hash قابل للتحقق |
| Release | GitHub Release يحتوي APK وSHA256SUMS وملاحظات دقيقة |
| الموقع | زر التنزيل ظاهر ويشير إلى الإصدار الرسمي |
| الإنتاج | health وroutes وsmoke tests ناجحة بعد النشر |

## مخاطر ومتطلبات خارجية
يتطلب الإصدار الحقيقي release keystore أو Play App Signing، وقد يتطلب صلاحية مالك حساب GitHub/Vercel وبيانات Google OAuth وSupabase. لا يمكن اختبار كل أجهزة Android الفعلية داخل CI. لا يجوز تجاوز فحص فاشل أو تعطيل حماية main لمجرد إكمال الدمج. إذا غابت بيانات التوقيع، ستكون النتيجة APK debug أو workflow جاهزًا، وليس إصدارًا release موقّعًا.

## المخرجات
سيتم تنفيذ التغييرات عبر branch وPull Request، ثم دمجها فقط بعد نجاح الفحوصات. المخرجات النهائية ستكون workflow الإصدار، إعدادات الحماية، APK release إن توفرت بيانات التوقيع، GitHub Release، SHA-256، رابط تنزيل الموقع، وتقرير اختبارات يوضح ما تم إثباته وما يتطلب جهازًا أو صلاحية خارجية.

# توثيق التحقق من ملكية الموقع في Google Search Console

## الحالة الحالية

الموقع يستخدم طريقتين متكاملتين للتحقق من ملكية النطاق `https://zikrmediaofficial.vercel.app`:

1. **وسما HTML داخل الصفحة الرئيسية** من خلال `verification.google` في `app/layout.tsx`.
2. **ملفا HTML ثابتان** داخل `public/`، ويجب أن يعيدا استجابة HTTP `200` من جذر الموقع:
   - `/google3526c15e10fa1913.html`
   - `/google6f7827292f8e19bc.html`

وجود الطريقتين مقصود؛ فلا ينبغي حذف أي منهما ما دامت الخاصيتان أو طرق التحقق المرتبطة بهما موجودتين في Search Console.

## الفحص المحلي

شغّل الأمر التالي من جذر المشروع:

```bash
pnpm search-console:check
```

يفحص الأمر وجود ملفي HTML، تطابق محتوى كل ملف مع اسمه، ووجود رمزي التحقق في `app/layout.tsx`. لا تضع رموز تحقق جديدة في سجل عام أو في وثائق خارج المستودع دون الحاجة.

## التحقق بعد النشر

بعد اكتمال نشر Vercel، تحقّق من الأصول العامة:

```bash
curl -i https://zikrmediaofficial.vercel.app/google3526c15e10fa1913.html
curl -i https://zikrmediaofficial.vercel.app/google6f7827292f8e19bc.html
curl -s https://zikrmediaofficial.vercel.app/ | grep -o 'google-site-verification[^>]*' | head
```

النتيجة المتوقعة هي `200` لكل ملف، وظهور وسمَي `google-site-verification` في HTML الصفحة الرئيسية. إذا أعاد أحد الملفين `404`، افحص أولًا أن الملف موجود تحت `public/` وأن النشر خرج من commit الصحيح، ثم أعد محاولة النشر قبل الضغط على **Verify** في Search Console.

## معالجة شاشة “Ownership verification”

من Search Console افتح الخاصية الصحيحة، ثم راجع **Settings → Ownership verification**. استخدم طريقة HTML file أو HTML tag المطابقة لما هو منشور. إذا كان التحقق مرتبطًا بنطاق DNS بدل خاصية URL-prefix، أضف سجل TXT الذي تعرضه Google إلى مزود DNS، ثم انتظر انتشار DNS وأعد التحقق.

لا تغيّر رموز التحقق يدويًا في الإنتاج. عند استبدال خاصية Search Console أو إنشاء رمز جديد، حدّث `app/layout.tsx` وملف HTML المقابل، ثم شغّل الفحص المحلي واختبار HTTP بعد النشر.

## سبب المشكلة التي عولجت

كان من السهل أن يظهر التحقق ناجحًا في commit محلي أو في خاصية مختلفة بينما لا يكون ملف HTML متاحًا على النطاق الفعلي. توحيد الأصول، وإضافة الفحص الآلي، وتوثيق اختبار HTTP يمنع هذا الالتباس ويجعل فشل النشر ظاهرًا قبل طلب التحقق مرة أخرى.

## GA4 وGoogle Tag Manager

كان سبب فشل اكتشاف GA4 أن المكوّن كان يُحمّل ديناميكيًا في المتصفح فقط بعد اكتمال الصفحة ومرور نحو عشر ثوانٍ. نُقلت تهيئة GA4 إلى `app/layout.tsx` داخل `head` باستخدام `next/script` و`beforeInteractive`، مع الإبقاء على معرّف القياس من `NEXT_PUBLIC_GA_MEASUREMENT_ID` فقط. لا توجد تهيئة ثانية لـ `gtag`؛ أما مكوّن التحليلات المتأخر فأصبح خاصًا بـ Vercel Speed Insights.

أضيف دعم GTM إلى الطبقة نفسها باستخدام `NEXT_PUBLIC_GTM_ID`. يظهر كود GTM و`noscript` فقط عندما تكون القيمة حقيقية وتطابق الصيغة `GTM-*`؛ لذلك لن يتم اختراع حاوية أو نشر كود مزيف. لم يُعثر في المستودع أو أسرار GitHub المتاحة على GTM ID حقيقي، كما لا يمكن تأكيد متغيرات مشروع Vercel من خلال جلسة لا تملك فريقًا متاحًا في Vercel MCP.

لإكمال التفعيل في Vercel، أضف القيم العامة الحقيقية في **Production**:

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...   # من خاصية GA4 الحقيقية
NEXT_PUBLIC_GTM_ID=GTM-...            # من حاوية GTM الحقيقية، إن كانت مستخدمة
```

بعد النشر، افحص المصدر الأولي للصفحة لا DOM بعد التفاعل:

```bash
curl -s https://zikrmediaofficial.vercel.app/ | grep -Eo 'googletagmanager\.com/(gtag/js|gtm\.js)|G-[A-Z0-9]+|GTM-[A-Z0-9]+' | sort -u
```

إذا كانت القيم صحيحة، يجب أن يظهر GA4 في `head`، ويجب أن يظهر GTM في `head` و`noscript` مباشرة بعد فتح `body`. نجاح تحقق Google Analytics وGTM يعتمد أيضًا على أن تكون الخاصية والحاوية والحساب المستخدم في Search Console هي الحسابات الصحيحة.

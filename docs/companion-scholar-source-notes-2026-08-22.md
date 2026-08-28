# ملاحظات مصادر حزمة الصحابة والعلماء

## مصادر تمت مراجعتها

1. **Britannica — Abu Abd Allah al-Shafi'i**
   URL: https://www.britannica.com/biography/Abu-Abd-Allah-ash-Shafii
   يذكر المصدر أن الشافعي فقيه مسلم أسهم في تشكيل الفكر القانوني الإسلامي، وأنه مؤسس المدرسة الشافعية، مع عرض موجز لمراحل طلبه للعلم ورحلاته وكتاب الرسالة. يجب استخدامه كمصدر تاريخي/أكاديمي لا كنص ديني ملزم.

2. **Britannica — al-Bukhari**
   URL: https://www.britannica.com/biography/al-Bukhari
   يعرض المصدر حياة البخاري ورحلاته ومنهجه في جمع الحديث وكتابه الصحيح، مع التنبيه إلى أن corpus الحديث يضم روايات متفاوتة وأن التحقق من كل حديث يكون بمرجعه ودرجته، لا بمجرد ذكر اسم الكتاب.

3. **Yaqeen Institute — Abu Huraira: The Preserver of Hadith**
   URL: https://yaqeeninstitute.org/watch/series/the-firsts/abu-huraira-ra-the-preserver-of-hadith-the-firsts
   الصفحة مادة تعليمية عن أبي هريرة رضي الله عنه، لكنها تنبه صراحة إلى أن transcript مولد آليًا وقد يحتوي أخطاء؛ لذلك لا يُنسخ transcript كنص منشور، ويُستخدم الرابط كمادة تعليمية ثانوية مع الرجوع إلى أرقام الأحاديث الأصلية.

4. **Yaqeen Institute — Salman al-Farsi: The Truth Seeker**
   URL: https://yaqeeninstitute.org/watch/series/the-firsts/salman-al-farsi-ra-the-truth-seeker-the-firsts
   الصفحة مادة تعليمية عن رحلة سلمان الفارسي رضي الله عنه، وتذكر ارتباط قصته برواية طويلة في فضائل الأنصار في صحيح البخاري. لا يُنسخ transcript الآلي مباشرة، بل يُربط بالمادة مع إحالة المصدر الأصلي.

## مخطط الإنتاج الحي

جدول `companions` يحتوي: id, name_ar, name_en, slug, bio_ar, bio_en, category, thumbnail_url, featured_image_url, order_num, published, metadata, created_at, updated_at.

جدول `scholars` يحتوي: id, name_ar, name_en, slug, bio_ar, bio_en, thumbnail_url, website_url, youtube_url, created_at, updated_at, published, metadata.

جدول `companion_stories` يحتوي: id, companion_id, title_ar, title_en, content_ar, content_en, story_type, order_num, created_at, updated_at.

يجب أن تُخزَّن المراجع في `metadata` للصحابة والعلماء بصيغة JSON منظمة، وتتضمن label وurl وsource_type وlocator عند توفر رقم كتاب/حديث. لا يُنشر transcript مولد آليًا أو قصة غير قابلة للتحقق.

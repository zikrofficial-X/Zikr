# مصفوفة صلاحيات واجهات Admin API — 12 نوفمبر 2026

هذه المصفوفة هي المرجع التنفيذي لصلاحيات معالجات HTTP في `src/app/api/admin`. يجب أن يتطابق كل مسار وطريقة HTTP مع الصلاحيات المدرجة حرفيًا. لا تكفي صلاحية عامة أو صلاحية أعلى غير لازمة بدلًا منها.

| الطريقة | المسار | الصلاحية الخادمية |
|---|---|---|
| GET | `/api/admin/analytics` | `analytics.read` |
| POST | `/api/admin/cloudinary/image` | `media.manage` |
| GET | `/api/admin/cloudinary/image` | رفض صريح 405 دون صلاحية أو أثر جانبي |
| GET | `/api/admin/content` | `content.manage` |
| GET | `/api/admin/media` | `media.manage` |
| POST | `/api/admin/media` | `media.manage` |
| PATCH | `/api/admin/media` | `media.manage` |
| GET | `/api/admin/overview` | `dashboard.view` |
| POST | `/api/admin/page-view` | `analytics.read` |
| GET | `/api/admin/sections` | `sections.manage` |
| POST | `/api/admin/sections` | `sections.manage` |
| GET | `/api/admin/site-audio` | `audio.manage` |
| POST | `/api/admin/site-audio` | `audio.manage` |
| PATCH | `/api/admin/site-audio` | `audio.manage` |
| DELETE | `/api/admin/site-audio` | `audio.manage` |
| POST | `/api/admin/site-audio/upload` | `audio.manage` |
| GET | `/api/admin/social/facebook/callback` | `social.manage` — validates OAuth state and stores the verified Page credential only; it never resumes queued posts |
| GET | `/api/admin/social/facebook/connect` | `social.manage` + `social.publish` MFA step-up — Page publishing + Insights permissions |
| GET | `/api/admin/social` | `social.manage` — queue and connection management |
| POST | `/api/admin/social` | `social.manage` + `social.publish` — step-up required for sensitive actions |
| GET | `/api/admin/social/written` | `social.manage` — written queue read |
| POST | `/api/admin/social/written` | `social.manage` + `social.publish` — MFA step-up before generation dispatch |
| POST | `/api/admin/video-generation/narration-upload` | `video.manage` |
| GET | `/api/admin/video-purge` | `video.delete` — dry-run preview only |
| POST | `/api/admin/video-purge` | `video.delete` — MFA step-up before destructive cleanup |
| GET | `/api/admin/video-generation` | `video.manage` |
| DELETE | `/api/admin/video-generation` | `video.delete` |
| PATCH | `/api/admin/video-generation` | `video.manage` — external publish retry returns HTTP 410 |
| GET | `/api/admin/video-generation/sources` | `video.manage` |
| GET | `/api/admin/social/youtube/connect` | `social.manage` + `social.publish` MFA step-up — OAuth requests upload, channel-read and analytics-read scopes |
| GET | `/api/admin/social/youtube/callback` | `social.manage` — validates upload/read scopes and stores the publishing refresh token |
| GET | `/api/admin/video/templates` | `video.manage` |
| POST | `/api/admin/video/templates` | `video.manage` |
| POST | `/api/admin/videos/[id]/retry` | `video.manage` |
| GET | `/api/admin/videos/[id]` | `video.manage` |
| PATCH | `/api/admin/videos/[id]` | `video.manage` |
| DELETE | `/api/admin/videos/[id]` | `video.delete` |
| POST | `/api/admin/videos/create` | `video.manage` |
| GET | `/api/admin/videos` | `video.manage` |
| POST | `/api/admin/videos/upload` | `video.manage` |
| GET | `/api/admin/videos/upload` | رفض صريح 405 دون صلاحية أو أثر جانبي |
| POST | `/api/admin/youtube-facebook/register-media` | `media.manage` — retired, HTTP 410 |
| POST | `/api/admin/youtube-facebook/upload-url` | `media.manage` — retired, HTTP 410 |

## ثوابت إضافية

- مسارات OAuth الخاصة بـFacebook وYouTube ومسارات إدارة طابور النشر الاجتماعي فعّالة ومحمية بالصلاحيات المدرجة أعلاه؛ عمليات النشر/التوليد الحساسة تتطلب `social.publish` مع MFA step-up.
- بدء OAuth الخاص بـFacebook يتطلب `social.manage` و`social.publish` مع MFA step-up. Callback يتحقق من state ويحفظ اعتماد الصفحة فقط؛ لا يعيد فتح عناصر الطابور ولا يطلق النشر. اعتماد توكن الخادم يتحقق من التوكن ويحفظه فقط، ولا يستأنف الطابور. استئناف العناصر المحجوبة حصريًا عبر `release_auth_blocked_queue` داخل POST `/api/admin/social`، ويتطلب `social.publish` وMFA وتأكيدًا صريحًا والتحقق من اتصال الصفحة؛ ولا يعيد إلا العناصر التي تقع ضمن `SOCIAL_PUBLISH_AFTER`، وتظل العناصر التاريخية الأقدم محجوبة.
- مسارا استيراد الوسائط القديمان `/api/admin/youtube-facebook/register-media` و`/api/admin/youtube-facebook/upload-url` فقط يعيدان HTTP 410 بعد التحقق من `media.manage`.
- بدء OAuth الخاص بـYouTube يتطلب `social.manage` و`social.publish` مع MFA step-up قبل طلب نطاق `youtube.upload`؛ Callback يتحقق من state والنطاقات ويخزن refresh token فقط ولا يطلق النشر. صلاحية النشر تظل منفصلة عن مجرد حفظ الاعتماد.
- نشر الفيديو داخل موقع ZIKR يستخدم `content_publish_queue` و`video.manage`، ولا يحتاج صلاحيات النشر الاجتماعي.
- إعادة محاولة النشر الخارجي للفيديو متوقفة وتعيد HTTP 410.
- حذف طلب فيديو أو سجل فيديو يحتاج `video.delete`، وليس `video.manage` وحدها.
- رفع الوسائط أو طلب رابط رفع يحتاج صلاحية مجال الوسائط أو الفيديو بحسب نوع الأصل.
- جميع عمليات التعديل والإرسال الحساسة تسجل Audit وفق عقود الخدمة؛ استثناءات القراءة و405 لا تنشئ أحداثًا وهمية.
- فاحص `scripts/verify-admin-api-guards.mjs` يتحقق من وجود الحارس قبل العمل المحمي، ويقارن قائمة الصلاحيات الفعلية بالمصفوفة أعلاه لكل معالج. أي مسار جديد يحتاج إضافة واعتماد سجل صريح قبل اجتياز Quality Gate.
- صلاحيات العناصر الظاهرة في التنقل لا تُعد بديلًا عن الحارس الخادمي، ولا تُمنح أي صلاحية بإخفاء/إظهار رابط فقط.

## نطاق الفحص

آخر جرد ناجح على `main` اكتشف 24 ملف API و43 معالج HTTP، منها معالجان GET يرفضان الطريقة صراحةً بـ405. كما اكتشف 14 وحدة Server Actions تضم 29 إجراءً محميًا. أصبح فاحص الصلاحيات يقارن صفوف هذه الوثيقة مباشرةً بالمصفوفة التنفيذية حتى لا تنحرف الوثيقة عن حراس المسارات. لا تتضمن هذه المصفوفة Server Actions؛ تظل خاضعة لفحص AST المنفصل في نفس الأداة.

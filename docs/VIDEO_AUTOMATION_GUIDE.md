# دليل نظام الفيديوهات التلقائي

## 🎬 نظرة عامة

يوفر مشروع ZIKR نظاماً متكاملاً لتوليد ونشر الفيديوهات الإسلامية تلقائياً على منصات متعددة (YouTube, Facebook).

---

## 🚀 البدء السريع

### 1. الوصول إلى صفحة الإدارة
```
https://your-domain.com/admin/videos
```

### 2. إنشاء فيديو جديد
```
انقر على زر "+ إنشاء فيديو جديد"
```

### 3. رفع فيديو جاهز أو توليده تلقائياً

لرفع فيديو جاهز، املأ العنوان والوصف والكابشن، ثم اختر ملف MP4 أو WebM أو MOV من حقل الرفع. يُرفع الملف مباشرة إلى Supabase Storage، وبعد اكتمال الرفع يُحفظ الرابط في نموذج النشر. الحد الأقصى للملف 512 ميجابايت.

يمكنك اختيار Facebook أو Facebook Reels أو YouTube. عند اختيار YouTube أو Facebook Reels يجب وجود ملف فيديو مرفوع أو رابط فيديو مباشر. يمكنك اختيار موعد مستقبلي، وسيعالج العامل الخلفي الطابور دون إبقاء المتصفح مفتوحاً.

لتوليد فيديو HeyGen بدل رفع ملف جاهز، اترك الرفع فارغاً، فعّل خيار التوليد التلقائي، وأدخل سكريبتاً مراجَعاً لا يقل عن 30 حرفاً.

### 4. النقر على "حفظ وتجهيز النشر"

يُحفظ الفيديو في الموقع، وتُنشأ مهمة في `social_publish_queue`. يقوم العامل الخلفي بتجهيز النشر ثم يحفظ معرف النشر لكل منصة وحالة النجاح أو الفشل.

---

## 📋 الفئات المدعومة

| الفئة | الكود | الوصف | مثال |
|-------|-------|--------|------|
| القرآن | `quran` | آيات قرآنية | {"type": "quran", "surahId": 1} |
| الحديث | `hadith` | أحاديث شريفة | {"type": "hadith", "hadithId": "123"} |
| القصص | `story` | قصص إسلامية | {"type": "story", "storyId": "456"} |
| الدعاء | `dua` | أدعية قرآنية | {"type": "dua", "duaId": "789"} |
| الأذكار | `adhkar` | أذكار يومية | {"type": "adhkar", "adhkarType": "morning"} |
| أخرى | `other` | محتوى آخر | {"type": "custom"} |

---

## 🔧 إعدادات البيئة

### المتطلبات الأساسية
```bash
# Supabase (مدمج بالفعل)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### اختياري: HeyGen (توليد الفيديوهات)
```bash
HEYGEN_API_KEY=your_heygen_api_key
HEYGEN_AVATAR_ID=your_avatar_id
HEYGEN_VOICE_ID=your_voice_id
```

### اختياري: YouTube (رفع الفيديو تلقائياً)
```bash
YOUTUBE_CLIENT_ID=your_google_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_google_oauth_client_secret
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
YOUTUBE_CHANNEL_ID=your_channel_id
```

يجب إنشاء Refresh Token بصلاحية OAuth الرسمية `https://www.googleapis.com/auth/youtube.upload`. مفتاح `YOUTUBE_API_KEY` مخصص لقراءة القناة العامة وليس كافياً لرفع الفيديو.

### اختياري: Facebook (نشر الفيديو وReels تلقائياً)
```bash
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
FACEBOOK_PAGE_ID=your_page_id
VIDEO_AUTO_PUBLISH=true
```

يجب أن يكون Page Access Token مرتبطاً بصفحتك وبصلاحيات Meta المطلوبة للنشر. لا تضع أي قيمة من هذه القيم في كود الواجهة أو GitHub.

---

## 🔁 دورة الرفع والنشر

1. يتحقق endpoint `/api/admin/videos/upload` من جلسة المدير ونوع الملف والحجم.
2. يصدر Supabase signed upload URL للـ bucket العام `videos`، بينما تسمح RLS بالرفع والتعديل والحذف للمديرين فقط.
3. يرفع المتصفح الملف مباشرة إلى Storage، ثم يحتفظ النموذج بـ `videoUrl` و`videoStorageKey` في حقول مخفية.
4. تحفظ `saveVideoPostAction` المصدر والكابشن في `videos.metadata` وتضيف صفاً في `social_publish_queue`.
5. يستلم `/api/internal/video-processing` الصف، ويرفع الفيديو إلى YouTube عبر OAuth2 وإلى Facebook عبر Page Video/Reels API، ثم يسجل النتائج والأخطاء.

## 💻 استخدام الـ API برمجياً

### إنشاء فيديو جديد

```javascript
const response = await fetch('/api/admin/videos/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'سورة الفاتحة',
    description: 'تلاوة الفاتحة',
    category: 'quran',
    content: JSON.stringify({
      type: 'quran',
      surahId: 1,
      ayahStart: 1,
      ayahEnd: 7
    })
  })
});

const video = await response.json();
console.log('Video ID:', video.id);
```

### الحصول على تفاصيل الفيديو

```javascript
const response = await fetch(`/api/admin/videos/${videoId}`);
const video = await response.json();

console.log('Title:', video.title);
console.log('Status:', video.status);
console.log('YouTube ID:', video.youtubeId);
console.log('Facebook ID:', video.facebookId);
```

### تحديث حالة الفيديو

```javascript
await fetch(`/api/admin/videos/${videoId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed',
    youtubeId: 'dQw4w9WgXcQ',
    facebookId: 'fb_123456'
  })
});
```

### إعادة محاولة فيديو فاشل

```javascript
const response = await fetch(`/api/admin/videos/${videoId}/retry`, {
  method: 'POST'
});

if (response.ok) {
  console.log('Retry successful');
}
```

---

## 📊 حالات الفيديو

### دورة حياة الفيديو

```
┌─────────────┐
│   قيد الانتظار  │
│  (pending)  │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ جاري المعالجة  │
│ (processing) │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
   ┌────────┐      ┌────────┐
   │ مكتمل   │      │ فشل    │
   │(completed)   │ (failed)│
   └────────┘      └────┬───┘
                        │
                        ▼
                  ┌──────────────┐
                  │ قيد الانتظار  │
                  │ (retry)      │
                  └──────────────┘
```

### وصف الحالات

| الحالة | الوصف |
|--------|--------|
| `pending` | الفيديو في انتظار المعالجة |
| `processing` | جاري توليد الفيديو |
| `completed` | تم التوليد والنشر بنجاح |
| `failed` | فشلت المعالجة (قابل للإعادة) |

---

## 🎯 حالات الاستخدام

### 1. نشر آيات قرآنية يومية

```javascript
// كل يوم، أنشئ فيديو لآية جديدة
const createDailyQuranVideo = async (surahId, ayahNum) => {
  const response = await fetch('/api/admin/videos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `آية اليوم - ${new Date().toLocaleDateString('ar-SA')}`,
      description: `آية قرآنية للتدبر والتفكر`,
      category: 'quran',
      content: JSON.stringify({
        type: 'quran',
        surahId,
        ayahStart: ayahNum,
        ayahEnd: ayahNum
      })
    })
  });
  
  return response.json();
};
```

### 2. نشر أحاديث صحيحة

```javascript
const createHadithVideo = async (hadithId, bookId) => {
  const response = await fetch('/api/admin/videos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'حديث اليوم',
      description: 'حديث شريف من السنة النبوية',
      category: 'hadith',
      content: JSON.stringify({
        type: 'hadith',
        hadithId,
        bookId
      })
    })
  });
  
  return response.json();
};
```

### 3. نشر أذكار الصباح والمساء

```javascript
const createAdhkarVideo = async (adhkarType) => {
  const titles = {
    morning: 'أذكار الصباح',
    evening: 'أذكار المساء',
    prayer: 'أذكار بعد الصلاة'
  };

  const response = await fetch('/api/admin/videos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: titles[adhkarType],
      description: `مجموعة ${titles[adhkarType]}`,
      category: 'adhkar',
      content: JSON.stringify({
        type: 'adhkar',
        adhkarType
      })
    })
  });
  
  return response.json();
};
```

---

## 🔍 مراقبة الفيديوهات

### الإحصائيات المتاحة

```
┌────────────────────────────────────────┐
│         إحصائيات الفيديوهات             │
├────────────────────────────────────────┤
│ إجمالي الطلبات:      45                │
│ قيد الانتظار:        5                 │
│ مكتملة:             35                 │
│ فاشلة:               5                 │
└────────────────────────────────────────┘
```

### التصفية المتقدمة

```
الكل          → عرض جميع الفيديوهات
قيد الانتظار  → فقط الفيديوهات المعلقة
جاري المعالجة → الفيديوهات تحت المعالجة
مكتملة        → الفيديوهات المنتهية
فاشلة         → الفيديوهات الفاشلة
```

---

## ⚠️ معالجة الأخطاء

### رسائل الخطأ الشائعة

| الخطأ | السبب | الحل |
|-------|-------|------|
| `Missing API Key` | لم يتم تعيين مفتاح API | أضف المفتاح إلى متغيرات البيئة |
| `Invalid Category` | فئة غير مدعومة | استخدم فئة من القائمة المدعومة |
| `Generation Failed` | فشلت عملية التوليد | تحقق من صحة المحتوى وأعد المحاولة |
| `Publishing Failed` | فشل النشر | تحقق من صلاحيات API وأعد المحاولة |

### عرض تفاصيل الخطأ

```javascript
// انقر على "👁️ التفاصيل" في الواجهة
// ستظهر نافذة تحتوي على:
// - رسالة الخطأ
// - التفاصيل الكاملة
// - المحتوى الذي تم محاولة معالجته
```

---

## 🔐 الأمان والصلاحيات

### مستويات الوصول

```
✅ المسؤولون (Admin)
   ├─ إنشاء فيديوهات جديدة
   ├─ عرض جميع الفيديوهات
   ├─ تحديث الحالة
   └─ إعادة محاولة الفاشلة

❌ المستخدمون العاديون
   ├─ لا يمكن إنشاء فيديوهات
   ├─ لا يمكن عرض الفيديوهات
   └─ لا يمكن التعديل
```

### التحقق من الصلاحيات

```javascript
// في واجهة الويب
const requireAdmin = () => {
  // يتم التحقق تلقائياً من قبل requireAdmin()
  // سيتم إعادة التوجيه لصفحة تسجيل الدخول إذا لزم الأمر
};
```

---

## 📚 أمثلة عملية

### مثال 1: برنامج يومي للنشر

```javascript
// schedule.js
import cron from 'node-cron';

// كل يوم في الساعة 8 صباحاً
cron.schedule('0 8 * * *', async () => {
  const randomSurah = Math.floor(Math.random() * 114) + 1;
  const randomAyah = Math.floor(Math.random() * 100) + 1;
  
  await createDailyQuranVideo(randomSurah, randomAyah);
  console.log('تم إنشاء فيديو يومي');
});
```

### مثال 2: معالجة دفعية

```javascript
// batch-create.js
const surahList = [1, 2, 3, 4, 5]; // الفاتحة إلى المائدة

for (const surah of surahList) {
  await createDailyQuranVideo(surah, 1);
  console.log(`تم إنشاء فيديو للسورة ${surah}`);
  
  // تأخير 2 ثانية بين الطلبات
  await new Promise(r => setTimeout(r, 2000));
}
```

### مثال 3: مراقبة تلقائية

```javascript
// monitor.js
const checkFailedVideos = async () => {
  const response = await fetch('/api/admin/videos?status=eq.failed');
  const failed = await response.json();
  
  for (const video of failed) {
    console.log(`محاولة إعادة: ${video.title}`);
    await fetch(`/api/admin/videos/${video.id}/retry`, {
      method: 'POST'
    });
  }
};

// كل 30 دقيقة
setInterval(checkFailedVideos, 30 * 60 * 1000);
```

---

## 📞 الدعم والمساعدة

### المشاكل الشائعة وحلولها

**المشكلة:** الفيديو عالق في حالة "جاري المعالجة"

**الحل:**
1. انتظر 5 دقائق
2. أعد تحميل الصفحة
3. إذا استمرت المشكلة، انقر على التفاصيل وتحقق من رسالة الخطأ
4. أعد محاولة الطلب

**المشكلة:** لا يظهر الفيديو على YouTube

**الحل:**
1. تحقق من معرف YouTube في التفاصيل
2. انتقل إلى قناتك على YouTube وتحقق من الفيديو
3. تأكد من أن الفيديو ليس في المسودات
4. تحقق من صلاحيات API

**المشكلة:** رسالة خطأ: "Invalid Category"

**الحل:**
استخدم إحدى الفئات التالية فقط:
- quran (القرآن)
- hadith (الحديث)
- story (القصص)
- dua (الدعاء)
- adhkar (الأذكار)
- other (أخرى)

---

## 🎓 التعلم المتقدم

### دراسة الكود

الملفات الرئيسية:
- `/lib/services/video-automation.ts` - منطق الفيديوهات
- `/app/api/admin/videos/route.ts` - API الرئيسي
- `/app/admin/videos/page.tsx` - واجهة الإدارة

### التوسعة والتطوير

يمكنك:
1. إضافة فئات جديدة
2. دعم منصات إضافية (TikTok, Instagram)
3. تخصيص نمط الفيديو (شخصيات مختلفة، أصوات)
4. إضافة المزيد من البيانات الوصفية

---

**آخر تحديث:** 15 أغسطس 2026

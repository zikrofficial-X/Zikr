# ZIKR Kids Game Assets

## Visual assets

أزيلت خلفيات PNG القديمة كبيرة الحجم بعد مراجعة النسخة الحالية: عرض الألعاب ومشاهدها يتم برسومات SVG داخل مكونات الواجهة، ولا تحتاج إلى تحميل تلك الصور المنفصلة. المكونات المعتمدة للرسوم هي:

- `src/features/kids/components/games/kids-game-art.tsx`
- `src/features/kids/components/games/kids-game-visuals.tsx`

هذا يمنع شحن ملفات خلفيات خام غير مستخدمة ضمن أصول الإنتاج، مع الإبقاء على ألوان وهوية المشاهد المرسومة داخل المكونات كما هي.

## Audio

- `public/audio/kids-adventure-theme.mp3`
- `public/audio/kids-night-theme.mp3`
- `public/audio/kids-learning-theme.mp3`

تظل المؤثرات والملفات الصوتية محلية داخل المستودع.

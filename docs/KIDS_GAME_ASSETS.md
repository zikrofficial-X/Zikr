# ZIKR Kids Game Assets

## Optimized visual scenes

الألعاب تستخدم خلفيات محلية محسّنة بصيغة WebP، وتضع فوقها تدرجات الألوان الحالية للمحافظة على الهوية البصرية. تم استبدال ملفات PNG الثقيلة بنسخ أخف دون تغيير ألوان الثيمات أو ترتيب عناصر اللعبة:

- `public/kids/games/scene-night-garden.webp`
- `public/kids/games/scene-moon-sky.webp`
- `public/kids/games/scene-mosque-courtyard.webp`

يربط `src/features/kids/components/games/kids-game-kit.tsx` الخلفيات بالثيمات المحلية، وتضيف مكونات SVG بقية عناصر المشاهد.

## Audio

- `public/audio/kids-adventure-theme.mp3`
- `public/audio/kids-night-theme.mp3`
- `public/audio/kids-learning-theme.mp3`

تظل المؤثرات والملفات الصوتية محلية داخل المستودع. وجود الملف داخل المستودع لا يثبت وحده ملكية التسجيل أو ترخيصه؛ لذلك يصنّف manifest ملفات MP3 المحلية على أنها تحتاج مراجعة مصدر الترخيص قبل النشر. المؤثرات التي تُولّد عبر Web Audio منفصلة عن ملفات الموسيقى.

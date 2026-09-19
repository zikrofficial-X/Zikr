# Assets

**Art direction:** ليل هادئ بلون teal داكن مع لمسات ذهبية دافئة وأخضر زمردي، رسوم تعليمية مستديرة وآمنة، كثافة بصرية منخفضة، ومساحات واضحة للنص العربي. المرجع يعرض ثلاثة أنماط لعب: runner، memory، وordering.

## Generated assets

| Asset | Prompt role | Local source | WebDev status |
|---|---|---|---|
| `zikr-games-reference.png` | مرجع بصري 16:9 لغلاف قسم الألعاب وثيم البطاقات | `/home/ubuntu/webdev-static-assets/zikr-games-reference.png` | لم يُرفع: لا يوجد مشروع WebDev نشط في جلسة المستودع |
| `zikr-games-badge.png` | شارة هلال ونجوم شفافة للاستخدام في الغلاف عند تفعيل تخزين WebDev | `/home/ubuntu/webdev-static-assets/zikr-games-badge.png` | لم تُرفع: لا يوجد مشروع WebDev نشط في جلسة المستودع |
| `scene-night-garden.png` | خلفية ليلية للمغامرات والذاكرة | `public/kids/games/scene-night-garden.png` | محليًا داخل المستودع |
| `scene-moon-sky.png` | خلفية طيران الهلال والألعاب الهادئة | `public/kids/games/scene-moon-sky.png` | محليًا داخل المستودع |
| `scene-mosque-courtyard.png` | خلفية ساحة خيالية للتعلم والاستكشاف | `public/kids/games/scene-mosque-courtyard.png` | محليًا داخل المستودع |
| `kids-adventure-theme.mp3` | موسيقى مغامرة وحركة | `public/audio/kids-adventure-theme.mp3` | محليًا داخل المستودع |
| `kids-night-theme.mp3` | موسيقى ليلية للذاكرة والتركيز | `public/audio/kids-night-theme.mp3` | محليًا داخل المستودع |
| `kids-learning-theme.mp3` | موسيقى التعلم والإنجاز | `public/audio/kids-learning-theme.mp3` | محليًا داخل المستودع |

حتى يتم تفعيل مشروع WebDev، تعتمد الواجهة الحالية على CSS gradients وأيقونات السجل الخفيفة بدلاً من وضع ملفات كبيرة داخل `public/` أو شجرة التطبيق. عند توفر مشروع WebDev، تُرفع الأصول عبر `manus-upload-file --webdev` وتُستبدل الروابط في الغلاف دون تغيير منطق اللعبة.

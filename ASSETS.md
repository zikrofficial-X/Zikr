# Assets

**Art direction:** ليل هادئ بلون teal داكن مع لمسات ذهبية دافئة وأخضر زمردي، رسوم تعليمية مستديرة وآمنة، كثافة بصرية منخفضة، ومساحات واضحة للنص العربي. المرجع يعرض ثلاثة أنماط لعب: runner، memory، وordering.

## Generated assets

| Asset | Prompt role | Local source | WebDev status |
|---|---|---|---|
| `zikr-games-reference.png` | مرجع بصري 16:9 لغلاف قسم الألعاب وثيم البطاقات | `/home/ubuntu/webdev-static-assets/zikr-games-reference.png` | لم يُرفع: لا يوجد مشروع WebDev نشط في جلسة المستودع |
| `zikr-games-badge.png` | شارة هلال ونجوم شفافة للاستخدام في الغلاف عند تفعيل تخزين WebDev | `/home/ubuntu/webdev-static-assets/zikr-games-badge.png` | لم تُرفع: لا يوجد مشروع WebDev نشط في جلسة المستودع |

حتى يتم تفعيل مشروع WebDev، تعتمد الواجهة الحالية على CSS gradients وأيقونات السجل الخفيفة بدلاً من وضع ملفات كبيرة داخل `public/` أو شجرة التطبيق. عند توفر مشروع WebDev، تُرفع الأصول عبر `manus-upload-file --webdev` وتُستبدل الروابط في الغلاف دون تغيير منطق اللعبة.

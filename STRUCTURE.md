# Games Structure

- `lib/games/registry.ts`: مصدر الحقيقة لمعرفات الألعاب، بيانات العرض، الأهداف، المهارات، الثيمات، الأعمار، والصعوبة.
- `components/kids/games/games-index.tsx`: غلاف القسم ومسار البدء المقترح والمرشحات وبطاقات الألعاب.
- `components/kids/games/game-shell.tsx`: غلاف اللعبة، HUD، التحكم، النتائج، التقدم دون اتصال، هدف الجولة، واحتفال النجاح.
- `components/kids/games/world-game-stage.tsx`: موزع runtimes الحالي للألعاب التفاعلية.
- `lib/games/offline-queue.ts`: حفظ النتائج ومزامنتها لاحقاً.
- `lib/games/tone-feedback.ts`: صوت التغذية الراجعة مع احترام كتم الصوت.

القاعدة: يبقى `GAME_REGISTRY` المصدر الوحيد للعرض والربط، ولا يُنشأ مسار منفصل يتجاوز الموزع أو نظام النتائج الحالي.

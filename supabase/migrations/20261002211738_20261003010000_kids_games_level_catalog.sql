-- ZIKR Kids Games 2.0: make the level catalog canonical in Supabase.
-- Additive and idempotent: no existing user progress is deleted or rewritten.

alter table public.kids_game_levels drop constraint if exists kids_game_levels_game_id_level_no_key;

create unique index if not exists kids_game_levels_game_difficulty_level_uidx
  on public.kids_game_levels (game_id, difficulty, level_no);

with game_profiles(slug, mechanics, titles, objective) as (
  values
    ('zikr-runner', array['runner','collect','jump','combo']::text[], array['حديقة الذكر','سوق الأمانة','طريق المسجد','وادي النجوم','الفجر الهادئ','البوابة الذهبية']::text[], 'اجمع النجوم وتجاوز العوائق مع الحفاظ على السلسلة.'),
    ('zikr-memory', array['memory','matching','combo']::text[], array['بطاقات البداية','ممر المواقف','حديقة التذكر','مكتبة الذكر','ساحة التركيز','نجوم الذاكرة']::text[], 'طابق الموقف مع الذكر المناسب بأقل عدد من المحاولات.'),
    ('wudu-challenge', array['ordering','education','sequence']::text[], array['قطرة البداية','مجرى الماء','محطة النقاء','حديقة الوضوء','نافورة الهدوء','ماء الفجر']::text[], 'رتب خطوات الوضوء من المحتوى التعليمي المعتمد.'),
    ('verse-puzzle', array['verse','ordering','reading']::text[], array['الكلمة الأولى','درج الآية','ممر الحروف','ساحة الترتيب','نور الكلمات','بوابة الآية']::text[], 'رتب كلمات النص القرآني الموثق دون تغيير النص.'),
    ('zikr-quiz', array['quiz','learning','choice']::text[], array['سؤال البداية','محطة الفهم','ممر المعرفة','جولة التركيز','اختبار النجوم','تحدي المعنى']::text[], 'أجب عن أسئلة قصيرة وافهم سبب الإجابة.'),
    ('mosque-adventure', array['adventure','exploration','quest']::text[], array['البوابة','الساحة','المكتبة','الحديقة','المئذنة','بوابة النور']::text[], 'استكشف الخريطة وأكمل أهداف التعلم في كل محطة.'),
    ('zikr-road', array['road','decision','arcade']::text[], array['طريق البداية','طريق السوق','طريق المسجد','طريق النجوم','طريق الفجر','الطريق الذهبي']::text[], 'اختر المسار الآمن وواصل الرحلة مع التحديات القصيرة.'),
    ('zikr-jump', array['jump','platform','timing']::text[], array['أول خطوة','حديقة النجوم','الساحة الهادئة','سماء واسعة','طريق الهلال','الخاتمة الذهبية']::text[], 'اعبر المنصات مع توقيت هادئ واجمع النجوم.'),
    ('good-deeds', array['good-deeds','choice','values']::text[], array['مساعدة صغيرة','كلمة طيبة','ترتيب المكان','مشاركة جميلة','مسار التعاون','صندوق الخير']::text[], 'اختر عملاً طيباً وأكمله داخل العالم التعليمي.'),
    ('hilal-fly', array['fly','arcade','collect']::text[], array['حديقة القمر','سماء فضية','ليل الفوانيس','المدينة الهادئة','طريق النجوم','الفجر الذهبي']::text[], 'حرّك الهلال بين الغيوم واجمع النجوم بأمان.'),
    ('mosque-cleanup', array['cleanup','sorting','drag-drop']::text[], array['ركن الكتب','ركن الضوء','ركن اللعب','ركن النباتات','الساحة','قاعة الترتيب']::text[], 'ضع كل عنصر في مكانه الصحيح ورتب البيئة.'),
    ('zikr-coloring', array['coloring','creative','collection']::text[], array['لوحة البداية','هلال صغير','حديقة هادئة','نجمة مضيئة','قبة المسجد','سماء الفجر']::text[], 'لوّن اللوحة واحفظ تقدمك في معرضك المحلي.')
)
insert into public.kids_game_levels (
  game_id, level_no, title_ar, title_en, description_ar, objective_ar,
  mechanic, difficulty, reward_xp, reward_badge, config, published
)
select
  g.id,
  n.level_no,
  p.titles[1 + ((n.level_no - 1) % array_length(p.titles, 1))] || ' ' || n.level_no,
  'Level ' || n.level_no,
  'مرحلة ' || n.level_no || ' من المسار المتدرج للعبة.',
  p.objective,
  p.mechanics[1 + ((n.level_no - 1) % array_length(p.mechanics, 1))],
  d.difficulty,
  12 + (n.level_no * 2) + case d.difficulty when 'normal' then 4 when 'hard' then 8 else 0 end,
  case when n.level_no = 5 then g.slug || '-level-05'
       when n.level_no = 10 then g.slug || '-level-10'
       when n.level_no = 20 then g.slug || '-level-20'
       else null end,
  jsonb_build_object(
    'catalogVersion', 2,
    'levelNo', n.level_no,
    'difficulty', d.difficulty,
    'paceMultiplier', round((0.92 + (n.level_no * 0.018) + case d.difficulty when 'normal' then 0.12 when 'hard' then 0.24 else 0 end)::numeric, 3),
    'densityMultiplier', round((0.86 + ((n.level_no - 1) % 9) * 0.055 + case d.difficulty when 'normal' then 0.08 when 'hard' then 0.16 else 0 end)::numeric, 3),
    'pattern', ((n.level_no - 1) % 8),
    'palette', ((n.level_no - 1) % 12),
    'replayable', true
  ),
  true
from public.kids_games g
join game_profiles p on p.slug = g.slug
cross join unnest(array['easy','normal','hard']::text[]) as d(difficulty)
cross join generate_series(1, 20) as n(level_no)
on conflict (game_id, difficulty, level_no)
do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  description_ar = excluded.description_ar,
  objective_ar = excluded.objective_ar,
  mechanic = excluded.mechanic,
  reward_xp = excluded.reward_xp,
  reward_badge = excluded.reward_badge,
  config = excluded.config,
  published = excluded.published,
  updated_at = now();

with metadata(slug, mechanics, control_scheme, world, mission_types) as (
  values
    ('zikr-runner', array['runner','collect','jump','combo']::text[], 'swipe+jump', 'runner-world', array['collectibles','score','distance']::text[]),
    ('zikr-memory', array['memory','matching','combo']::text[], 'tap', 'memory-world', array['collectibles','score','complete']::text[]),
    ('wudu-challenge', array['ordering','education','sequence']::text[], 'tap', 'wudu-world', array['complete','score','combo']::text[]),
    ('verse-puzzle', array['verse','ordering','reading']::text[], 'tap', 'verse-world', array['complete','score','combo']::text[]),
    ('zikr-quiz', array['quiz','learning','choice']::text[], 'tap', 'quiz-world', array['complete','score','combo']::text[]),
    ('mosque-adventure', array['adventure','exploration','quest']::text[], 'tap+swipe', 'mosque-world', array['complete','collectibles','score']::text[]),
    ('zikr-road', array['road','decision','arcade']::text[], 'swipe', 'road-world', array['distance','score','collectibles']::text[]),
    ('zikr-jump', array['jump','platform','timing']::text[], 'swipe+tap', 'jump-world', array['distance','score','collectibles']::text[]),
    ('good-deeds', array['good-deeds','choice','values']::text[], 'tap', 'good-deeds-world', array['complete','score','collectibles']::text[]),
    ('hilal-fly', array['fly','arcade','collect']::text[], 'tap+hold', 'hilal-world', array['distance','score','collectibles']::text[]),
    ('mosque-cleanup', array['cleanup','sorting','drag-drop']::text[], 'tap+drag', 'cleanup-world', array['complete','score','collectibles']::text[]),
    ('zikr-coloring', array['coloring','creative','collection']::text[], 'tap', 'coloring-world', array['complete','collectibles','score']::text[])
)
update public.kids_games g
set mechanics = m.mechanics,
    metadata = coalesce(g.metadata, '{}'::jsonb) || jsonb_build_object(
      'catalogVersion', 2,
      'levelCount', 20,
      'difficultyProfiles', jsonb_build_array('easy','normal','hard'),
      'controlScheme', m.control_scheme,
      'world', m.world,
      'missionTypes', m.mission_types,
      'replayable', true
    ),
    updated_at = now()
from metadata m
where g.slug = m.slug;

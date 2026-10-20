-- Add the child-safe Arabic letter matching game to the canonical Kids content catalog.
INSERT INTO public.kids_content (
  slug, title_ar, title_en, type, age_group, content_ar, content_en, metadata, published, is_active
)
VALUES (
  'letter-lab',
  'مختبر الحروف',
  'Arabic Letter Lab',
  'game',
  '3-5',
  'لعبة تعليمية قصيرة للتعرف على الحروف العربية ومطابقتها.',
  'A short educational game for recognizing and matching Arabic letters.',
  jsonb_build_object(
    'gameId', 'letter-lab', 'version', 1, 'difficulty', 'easy',
    'category', 'لغة وتعلم', 'objective', 'مطابقة الحروف العربية',
    'safetyNote', 'اللعب مستقل عن المقارنة مع الآخرين ويُنصح بالتفاعل مع أحد الوالدين.'
  ),
  true,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  type = EXCLUDED.type,
  age_group = EXCLUDED.age_group,
  content_ar = EXCLUDED.content_ar,
  content_en = EXCLUDED.content_en,
  metadata = COALESCE(public.kids_content.metadata, '{}'::jsonb) || EXCLUDED.metadata,
  published = EXCLUDED.published,
  is_active = EXCLUDED.is_active,
  updated_at = now();

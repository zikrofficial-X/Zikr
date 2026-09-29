-- Identify the affected stories as fictional/editorial and persist their expanded educational sections.
-- The content itself was expanded in the production migration with the same slugs.

update public.stories
set metadata = metadata || jsonb_build_object(
  'source_type','fictional_editorial',
  'source_name','ذِكر — قصة تربوية متخيلة',
  'source_url','https://zikrmediaofficial.vercel.app/editorial-policy',
  'editorial_status','published',
  'fictional_story',true
),
updated_at = now()
where published = true
  and slug in ('zikr-story-01','zikr-story-02','zikr-story-03','zikr-story-04','zikr-story-05','zikr-story-06','zikr-story-07','zikr-story-08','zikr-story-09');

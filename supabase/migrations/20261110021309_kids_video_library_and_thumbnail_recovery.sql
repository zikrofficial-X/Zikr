insert into public.video_categories
  (name_ar, name_en, slug, description_ar, description_en, icon, published, is_active)
values
  ('قصص الأطفال', 'Kids Stories', 'kids-stories',
   'فيديوهات قصصية تعليمية موجهة للأطفال فقط.',
   'Child-directed story videos for the ZIKR Kids library.',
   '🎈', true, true)
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  icon = excluded.icon,
  published = true,
  is_active = true,
  updated_at = now();

update public.videos
set category_id = (select id from public.video_categories where slug = 'kids-stories' limit 1),
    updated_at = now()
where published = true
  and metadata->>'audience' = 'kids'
  and category_id is distinct from (select id from public.video_categories where slug = 'kids-stories' limit 1);

update public.videos
set thumbnail_url = case
  when youtube_id ~ '^[A-Za-z0-9_-]{11}$'
    then 'https://i.ytimg.com/vi/' || youtube_id || '/hqdefault.jpg'
  when coalesce(metadata->>'generatedVideoUrl', metadata->>'videoUrl', metadata->>'video_url', metadata->>'sourceVideoUrl') ~ '^https://res\.cloudinary\.com/[^/]+/video/upload/.+\.(mp4|webm|mov|m4v)$'
    then regexp_replace(
      replace(
        coalesce(metadata->>'generatedVideoUrl', metadata->>'videoUrl', metadata->>'video_url', metadata->>'sourceVideoUrl'),
        '/video/upload/',
        '/video/upload/so_0/'
      ),
      '\.(mp4|webm|mov|m4v)$',
      '.jpg'
    )
  else '/branding/og-image.jpg'
end,
updated_at = now()
where published = true and thumbnail_url is null;

update public.videos
set metadata = jsonb_set(
      coalesce(metadata, '{}'::jsonb),
      '{publicPath}',
      to_jsonb('/kids/videos/' || slug),
      true
    ),
    updated_at = now()
where published = true
  and metadata->>'audience' = 'kids'
  and metadata->>'publicPath' is distinct from '/kids/videos/' || slug;

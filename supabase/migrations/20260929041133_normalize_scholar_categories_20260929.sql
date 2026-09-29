-- Normalize legacy scholar records into the catalog category filter.
update public.scholars
set metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{category}', '"متقدمين"', true),
    updated_at = now()
where published = true
  and coalesce(metadata->>'category', '') = '';

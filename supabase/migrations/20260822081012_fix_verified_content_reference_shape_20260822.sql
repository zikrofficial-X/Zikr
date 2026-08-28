-- Normalize reference metadata for the verified companions and scholars pack.
-- Keeps legacy locator values readable while standardizing on locator_ar.

update public.companions c
set metadata = jsonb_set(
  coalesce(c.metadata, '{}'::jsonb),
  '{references}',
  coalesce((
    select jsonb_agg(
      case
        when ref ? 'locator' then
          jsonb_set(ref - 'locator', '{locator_ar}', ref->'locator')
        else ref
      end
    )
    from jsonb_array_elements(coalesce(c.metadata->'references', '[]'::jsonb)) as refs(ref)
  ), '[]'::jsonb),
  true
), updated_at = now()
where c.slug in ('abu-huraira', 'salman-al-farisi', 'muadh-ibn-jabal', 'asma-bint-abi-bakr');

update public.scholars s
set metadata = jsonb_set(
  coalesce(s.metadata, '{}'::jsonb),
  '{references}',
  coalesce((
    select jsonb_agg(
      case
        when ref ? 'locator' then
          jsonb_set(ref - 'locator', '{locator_ar}', ref->'locator')
        else ref
      end
    )
    from jsonb_array_elements(coalesce(s.metadata->'references', '[]'::jsonb)) as refs(ref)
  ), '[]'::jsonb),
  true
), updated_at = now()
where s.slug in ('shafii', 'bukhari', 'malik-ibn-anas', 'ahmad-ibn-hanbal');

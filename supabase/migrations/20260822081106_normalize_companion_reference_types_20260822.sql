-- Keep the public reference renderer within its supported source taxonomy.
update public.companions c
set metadata = jsonb_set(
  coalesce(c.metadata, '{}'::jsonb),
  '{references}',
  coalesce((
    select jsonb_agg(
      case
        when ref->>'source_type' = 'secondary' then
          jsonb_set(ref, '{source_type}', '"editorial"'::jsonb)
        else ref
      end
    )
    from jsonb_array_elements(coalesce(c.metadata->'references', '[]'::jsonb)) as refs(ref)
  ), '[]'::jsonb),
  true
), updated_at = now()
where c.slug in ('abu-huraira', 'salman-al-farisi', 'muadh-ibn-jabal', 'asma-bint-abi-bakr');

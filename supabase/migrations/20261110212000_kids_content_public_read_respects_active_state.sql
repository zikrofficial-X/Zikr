begin;

drop policy if exists "kids_content_public_read" on public.kids_content;

create policy "kids_content_public_read"
on public.kids_content
for select
to anon, authenticated
using (
  published is true
  and is_active is true
  and (
    type <> 'story'
    or metadata->'age_appropriate' = 'true'::jsonb
  )
);

-- Keep the server-side share counter aligned with the same public visibility
-- contract; inactive, unpublished, or unapproved stories must not accept public shares.
create or replace function public.increment_kids_content_shares(p_slug text)
returns table(slug text, shares integer)
language sql
security definer
set search_path to public
as $function$
  update public.kids_content
  set shares = coalesce(kids_content.shares, 0) + 1,
      updated_at = now()
  where kids_content.slug = p_slug
    and kids_content.published is true
    and kids_content.is_active is true
    and (
      kids_content.type <> 'story'
      or kids_content.metadata->'age_appropriate' = 'true'::jsonb
    )
  returning kids_content.slug, kids_content.shares;
$function$;

revoke all on function public.increment_kids_content_shares(text) from public;
revoke execute on function public.increment_kids_content_shares(text) from anon, authenticated;
grant execute on function public.increment_kids_content_shares(text) to service_role;

commit;

-- Consolidate public-read + admin-read policies without overlapping RLS grants.
-- Preserve public visibility for anonymous users and allow authenticated admins to
-- see unpublished records where the previous admin-only SELECT policy did so.

-- Competitions
drop policy if exists admin_only_competitions on public.competitions;
drop policy if exists "Public can read published competitions" on public.competitions;
create policy "Public can read published competitions"
  on public.competitions for select to anon
  using (published = true);
create policy "Authenticated can read competitions"
  on public.competitions for select to authenticated
  using (published = true or private.is_admin_user());

-- Memorization plans
drop policy if exists admin_only_memorization_plans on public.memorization_plans;
drop policy if exists "Public can read published memorization plans" on public.memorization_plans;
create policy "Public can read published memorization plans"
  on public.memorization_plans for select to anon
  using (published = true);
create policy "Authenticated can read memorization plans"
  on public.memorization_plans for select to authenticated
  using (published = true or private.is_admin_user());

-- Pinned messages
drop policy if exists admin_only_pinned_messages on public.pinned_messages;
drop policy if exists "Public can read published pinned messages" on public.pinned_messages;
create policy "Public can read published pinned messages"
  on public.pinned_messages for select to anon
  using (published = true);
create policy "Authenticated can read pinned messages"
  on public.pinned_messages for select to authenticated
  using (published = true or private.is_admin_user());

-- Site settings were already publicly readable; keep that behavior explicit
-- while removing the overlapping admin ALL policy from SELECT.
drop policy if exists admin_only_site_settings on public.site_settings;
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select to anon
  using (true);
create policy "Authenticated can read site settings"
  on public.site_settings for select to authenticated
  using (true);

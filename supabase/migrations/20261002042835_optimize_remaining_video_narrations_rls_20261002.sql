-- Remote migration: 20261002042835
-- Compatibility hardening: video_narrations is a retired legacy table and is
-- intentionally absent from a clean Preview schema. Apply the policy only when
-- the table still exists.
DO $migration$
BEGIN
  IF to_regclass('public.video_narrations') IS NOT NULL THEN
    EXECUTE 'drop policy if exists "Admins only can manage video narrations" on public.video_narrations';
    EXECUTE $policy$
      create policy "Admins only can manage video narrations" on public.video_narrations for all to public
      using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role))
      with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role))
    $policy$;
  END IF;
END
$migration$;

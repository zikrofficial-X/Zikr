-- Explicit deny policies make the server-only contract visible to Supabase's RLS advisor while preserving service-role access for trusted server/worker paths.
do $$
begin
  if to_regclass('public.admin_settings') is not null then
    drop policy if exists "server_only_deny_anon_authenticated" on public.admin_settings;
    create policy "server_only_deny_anon_authenticated"
      on public.admin_settings
      as restrictive
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;

  if to_regclass('public.content_revisions') is not null then
    drop policy if exists "server_only_deny_anon_authenticated" on public.content_revisions;
    create policy "server_only_deny_anon_authenticated"
      on public.content_revisions
      as restrictive
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;

  if to_regclass('public.video_automation_runs') is not null then
    drop policy if exists "server_only_deny_anon_authenticated" on public.video_automation_runs;
    create policy "server_only_deny_anon_authenticated"
      on public.video_automation_runs
      as restrictive
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end $$;

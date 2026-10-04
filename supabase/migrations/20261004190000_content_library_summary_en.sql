-- Production hardening: keep the public content contract aligned with the application.
-- English summaries are optional derivatives; Arabic remains canonical.

alter table public.content_library
  add column if not exists summary_en text;

comment on column public.content_library.summary_en is
  'Optional English summary derivative of the canonical Arabic summary.';

-- content_translation_queue is a server-side queue. Explicit deny policies make the
-- intended client isolation clear while preserving service-role/server access.
drop policy if exists content_translation_queue_deny_anon on public.content_translation_queue;
create policy content_translation_queue_deny_anon
  on public.content_translation_queue
  as restrictive
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists content_translation_queue_deny_authenticated on public.content_translation_queue;
create policy content_translation_queue_deny_authenticated
  on public.content_translation_queue
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

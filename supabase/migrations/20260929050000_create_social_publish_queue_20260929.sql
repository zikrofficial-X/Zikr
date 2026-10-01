-- Create the queue used by admin-triggered social publishing.
create table if not exists public.social_publish_queue (
  id uuid primary key default gen_random_uuid(),
  automation_key text,
  content_type text not null,
  content_id uuid,
  video_url text,
  target_platforms text[] not null default '{}',
  status text not null default 'pending',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_publish_queue enable row level security;

drop policy if exists social_publish_queue_admin_all on public.social_publish_queue;
create policy social_publish_queue_admin_all
  on public.social_publish_queue
  for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create unique index if not exists social_publish_queue_automation_key_uidx
  on public.social_publish_queue(automation_key)
  where automation_key is not null;

create index if not exists social_publish_queue_status_idx
  on public.social_publish_queue(status, scheduled_at);

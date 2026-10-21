-- Analytics and editorial scheduling for the admin workspace.
create table if not exists public.admin_page_views (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  viewed_at timestamptz not null default now()
);
create index if not exists admin_page_views_viewed_at_idx on public.admin_page_views (viewed_at desc);
create index if not exists admin_page_views_route_idx on public.admin_page_views (route, viewed_at desc);
alter table public.admin_page_views enable row level security;
drop policy if exists admin_page_views_service_role on public.admin_page_views;
create policy admin_page_views_service_role on public.admin_page_views for all to service_role using (true) with check (true);

create table if not exists public.content_publish_queue (
  id uuid primary key default gen_random_uuid(),
  content_table text not null check (content_table in ('articles','stories','competitions','memorization_plans','pinned_messages')),
  content_id uuid not null,
  scheduled_at timestamptz not null,
  status text not null default 'queued' check (status in ('queued','processing','published','cancelled','failed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  error_message text
);
create index if not exists content_publish_queue_schedule_idx on public.content_publish_queue (status, scheduled_at asc);
create unique index if not exists content_publish_queue_one_queued_item on public.content_publish_queue (content_table, content_id) where status = 'queued';
alter table public.content_publish_queue enable row level security;
drop policy if exists content_publish_queue_service_role on public.content_publish_queue;
create policy content_publish_queue_service_role on public.content_publish_queue for all to service_role using (true) with check (true);

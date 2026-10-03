create table if not exists public.content_translation_queue (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  content_id text not null,
  source_locale text not null default 'ar',
  target_locale text not null default 'en',
  source_hash text not null,
  source_payload jsonb not null default '{}'::jsonb,
  draft_payload jsonb,
  status text not null default 'queued'
    check (status in ('queued','processing','generated','approved','published','failed')),
  provider text,
  model text,
  attempt_count integer not null default 0,
  error_message text,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, content_id, target_locale, source_hash)
);

create index if not exists content_translation_queue_status_idx
  on public.content_translation_queue(status, available_at);

create index if not exists content_translation_queue_content_idx
  on public.content_translation_queue(content_type, content_id, target_locale);

alter table public.content_translation_queue enable row level security;

comment on table public.content_translation_queue is
  'Server-side queue for localized content drafts. Arabic remains canonical; English output is tracked with source hash and provenance.';

create or replace function public.touch_content_translation_queue_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_translation_queue_updated_at on public.content_translation_queue;
create trigger content_translation_queue_updated_at
before update on public.content_translation_queue
for each row execute function public.touch_content_translation_queue_updated_at();
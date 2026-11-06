create table if not exists public.youtube_oauth_credentials (
  provider text primary key not null default 'youtube'
    check (provider = 'youtube'),
  refresh_token text not null,
  granted_scopes text[] not null default '{}'::text[],
  channel_id text not null,
  channel_name text,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.youtube_oauth_credentials enable row level security;

revoke all on table public.youtube_oauth_credentials from anon, authenticated;
grant select, insert, update, delete on table public.youtube_oauth_credentials to service_role;

comment on table public.youtube_oauth_credentials is
  'Server-only YouTube OAuth refresh credential. No anon/authenticated access; service_role only.';
comment on column public.youtube_oauth_credentials.refresh_token is
  'Sensitive OAuth refresh token. Never return to browser or include in logs.';

-- Server-only storage for Facebook Page credentials acquired through Meta OAuth.
-- No client policies are created: tokens must never be readable through anon/authenticated PostgREST clients.
create table if not exists public.social_platform_credentials (
  platform text primary key check (platform in ('facebook')),
  page_id text not null,
  page_name text,
  page_access_token text not null,
  is_enabled boolean not null default false,
  token_type text not null default 'page',
  expires_at timestamptz,
  granted_permissions text[] not null default '{}'::text[],
  connection_status text not null default 'connected'
    check (connection_status in ('connected', 'disabled', 'reauthorization_required', 'permission_error', 'error')),
  last_validated_at timestamptz,
  last_error_code text,
  last_error_message text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_platform_credentials enable row level security;
revoke all on table public.social_platform_credentials from anon, authenticated;
grant select, insert, update, delete on table public.social_platform_credentials to service_role;

comment on table public.social_platform_credentials is
  'Server-only social publishing credentials. Do not expose this table to browser clients or public APIs.';
comment on column public.social_platform_credentials.page_access_token is
  'Meta Page access token obtained through server-side Facebook OAuth. Never include in client responses or logs.';
comment on column public.social_platform_credentials.is_enabled is
  'Explicit opt-in made by the admin by completing the Facebook OAuth connect flow.';

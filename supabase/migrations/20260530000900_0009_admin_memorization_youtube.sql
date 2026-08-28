create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  prize text,
  starts_at timestamptz,
  ends_at timestamptz,
  published boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pinned_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  cta_label text,
  cta_href text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memorization_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cadence text not null default 'daily',
  target_ref text,
  prompt text,
  tajweed_focus text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;
alter table competitions enable row level security;
alter table pinned_messages enable row level security;
alter table memorization_plans enable row level security;

do $$ begin
  create policy "Public can read published competitions" on competitions for select using (published = true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public can read published pinned messages" on pinned_messages for select using (published = true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public can read published memorization plans" on memorization_plans for select using (published = true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Public can read site settings" on site_settings for select using (true);
exception when duplicate_object then null;
end $$;

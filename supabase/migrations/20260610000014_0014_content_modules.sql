-- Phase: Content Modules
-- Description: Create tables for Companions, Battles, and Conquests

-- Companions table
create table if not exists companions (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  bio_ar text,
  bio_en text,
  category text, -- khalifah, mubashsharun, sahaba
  thumbnail_url text,
  featured_image_url text,
  order_num integer,
  published boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Companion stories
create table if not exists companion_stories (
  id uuid primary key default gen_random_uuid(),
  companion_id uuid not null references companions(id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  content_ar text not null,
  content_en text,
  story_type text, -- biography, hadith, virtue, sacrifice
  order_num integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Battles table
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  description_ar text,
  description_en text,
  date_hijri text,
  date_gregorian text,
  location_ar text,
  location_en text,
  thumbnail_url text,
  featured_image_url text,
  order_num integer,
  published boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Battle events/details
create table if not exists battle_events (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references battles(id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  content_ar text not null,
  content_en text,
  event_type text, -- cause, battle_details, outcome, significance
  order_num integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conquests (Islamic expansions) table
create table if not exists conquests (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  description_ar text,
  description_en text,
  date_hijri text,
  date_gregorian text,
  location_ar text,
  location_en text,
  leader_ar text,
  leader_en text,
  thumbnail_url text,
  featured_image_url text,
  order_num integer,
  published boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conquest events/details
create table if not exists conquest_events (
  id uuid primary key default gen_random_uuid(),
  conquest_id uuid not null references conquests(id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  content_ar text not null,
  content_en text,
  event_type text, -- background, military_campaign, diplomatic, aftermath
  order_num integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on all tables
alter table companions enable row level security;
alter table companion_stories enable row level security;
alter table battles enable row level security;
alter table battle_events enable row level security;
alter table conquests enable row level security;
alter table conquest_events enable row level security;

-- RLS Policies for companions (public read)
create policy "companions_public_read" on companions
  for select using (published = true);

create policy "companions_admin_write" on companions
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- RLS Policies for companion_stories (public read)
create policy "companion_stories_public_read" on companion_stories
  for select using (exists (
    select 1 from companions c where c.id = companion_id and c.published = true
  ));

-- RLS Policies for battles (public read)
create policy "battles_public_read" on battles
  for select using (published = true);

create policy "battles_admin_write" on battles
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- RLS Policies for battle_events (public read)
create policy "battle_events_public_read" on battle_events
  for select using (exists (
    select 1 from battles b where b.id = battle_id and b.published = true
  ));

-- RLS Policies for conquests (public read)
create policy "conquests_public_read" on conquests
  for select using (published = true);

create policy "conquests_admin_write" on conquests
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- RLS Policies for conquest_events (public read)
create policy "conquest_events_public_read" on conquest_events
  for select using (exists (
    select 1 from conquests c where c.id = conquest_id and c.published = true
  ));

-- Create indexes for performance
create index if not exists companions_slug_idx on companions(slug);
create index if not exists companions_category_idx on companions(category);
create index if not exists companions_published_idx on companions(published);
create index if not exists companion_stories_companion_id_idx on companion_stories(companion_id);
create index if not exists battles_slug_idx on battles(slug);
create index if not exists battles_published_idx on battles(published);
create index if not exists battle_events_battle_id_idx on battle_events(battle_id);
create index if not exists conquests_slug_idx on conquests(slug);
create index if not exists conquests_published_idx on conquests(published);
create index if not exists conquest_events_conquest_id_idx on conquest_events(conquest_id);

-- Trigger to auto-update updated_at columns
create trigger update_companions_updated_at before update on companions
  for each row execute function public.update_updated_at_column();

create trigger update_companion_stories_updated_at before update on companion_stories
  for each row execute function public.update_updated_at_column();

create trigger update_battles_updated_at before update on battles
  for each row execute function public.update_updated_at_column();

create trigger update_battle_events_updated_at before update on battle_events
  for each row execute function public.update_updated_at_column();

create trigger update_conquests_updated_at before update on conquests
  for each row execute function public.update_updated_at_column();

create trigger update_conquest_events_updated_at before update on conquest_events
  for each row execute function public.update_updated_at_column();

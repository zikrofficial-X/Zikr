-- Phase: Tawasheeh and Reciters System
-- Description: Create tables for Islamic soundscapes and Quran reciters

-- Tawasheeh categories
create table if not exists tawasheeh_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  description_ar text,
  description_en text,
  icon text,
  order_num integer,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tawasheeh (Islamic soundscapes/hymns)
create table if not exists tawasheeh (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  slug text unique not null,
  description_ar text,
  description_en text,
  artist_ar text,
  artist_en text,
  category_id uuid references tawasheeh_categories(id) on delete set null,
  audio_url text,
  thumbnail_url text,
  duration integer, -- in seconds
  views integer default 0,
  published boolean default true,
  featured boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tawasheeh favorites
create table if not exists tawasheeh_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tawasheeh_id uuid not null references tawasheeh(id) on delete cascade,
  created_at timestamptz default now(),
  constraint tawasheeh_favorites_unique unique(user_id, tawasheeh_id)
);

-- Tawasheeh playlists
create table if not exists tawasheeh_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tawasheeh playlist items
create table if not exists tawasheeh_playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references tawasheeh_playlists(id) on delete cascade,
  tawasheeh_id uuid not null references tawasheeh(id) on delete cascade,
  order_num integer,
  created_at timestamptz default now(),
  constraint playlist_items_unique unique(playlist_id, tawasheeh_id)
);

-- Reciters favorites
create table if not exists reciter_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reciter_id uuid not null references quran_reciters(id) on delete cascade,
  created_at timestamptz default now(),
  constraint reciter_favorites_unique unique(user_id, reciter_id)
);

-- Recent recitations (tracks recently played surahs by reciter)
create table if not exists recent_recitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reciter_id uuid not null references quran_reciters(id) on delete cascade,
  surah_id integer not null,
  ayah_number integer,
  played_at timestamptz default now(),
  duration_listened integer, -- in seconds
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table tawasheeh_categories enable row level security;
alter table tawasheeh enable row level security;
alter table tawasheeh_favorites enable row level security;
alter table tawasheeh_playlists enable row level security;
alter table tawasheeh_playlist_items enable row level security;
alter table reciter_favorites enable row level security;
alter table recent_recitations enable row level security;

-- RLS Policies for tawasheeh_categories (public read)
create policy "tawasheeh_categories_public_read" on tawasheeh_categories
  for select using (published = true);

-- RLS Policies for tawasheeh (public read)
create policy "tawasheeh_public_read" on tawasheeh
  for select using (published = true);

-- RLS Policies for tawasheeh_favorites
create policy "tawasheeh_favorites_owner_all" on tawasheeh_favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policies for tawasheeh_playlists
create policy "tawasheeh_playlists_owner_all" on tawasheeh_playlists
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tawasheeh_playlists_public_read" on tawasheeh_playlists
  for select using (is_public = true);

-- RLS Policies for tawasheeh_playlist_items
create policy "tawasheeh_playlist_items_owner_all" on tawasheeh_playlist_items
  for all using (exists (
    select 1 from tawasheeh_playlists p where p.id = playlist_id and p.user_id = auth.uid()
  )) with check (exists (
    select 1 from tawasheeh_playlists p where p.id = playlist_id and p.user_id = auth.uid()
  ));

-- RLS Policies for reciter_favorites
create policy "reciter_favorites_owner_all" on reciter_favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policies for recent_recitations
create policy "recent_recitations_owner_all" on recent_recitations
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists tawasheeh_categories_slug_idx on tawasheeh_categories(slug);
create index if not exists tawasheeh_slug_idx on tawasheeh(slug);
create index if not exists tawasheeh_category_id_idx on tawasheeh(category_id);
create index if not exists tawasheeh_published_idx on tawasheeh(published);
create index if not exists tawasheeh_favorites_user_idx on tawasheeh_favorites(user_id);
create index if not exists tawasheeh_playlists_user_idx on tawasheeh_playlists(user_id);
create index if not exists reciter_favorites_user_idx on reciter_favorites(user_id);
create index if not exists recent_recitations_user_idx on recent_recitations(user_id);
create index if not exists recent_recitations_played_at_idx on recent_recitations(user_id, played_at desc);

-- Trigger to auto-update updated_at columns
create trigger update_tawasheeh_categories_updated_at before update on tawasheeh_categories
  for each row execute function public.update_updated_at_column();

create trigger update_tawasheeh_updated_at before update on tawasheeh
  for each row execute function public.update_updated_at_column();

create trigger update_tawasheeh_playlists_updated_at before update on tawasheeh_playlists
  for each row execute function public.update_updated_at_column();

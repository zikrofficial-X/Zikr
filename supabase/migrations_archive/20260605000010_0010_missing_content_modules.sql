-- Phase 5: Missing Content Modules (Duas, Articles, Videos, Kids, Prophets)

-- Duas Tables
create table if not exists dua_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  description_ar text,
  description_en text,
  icon text,
  published boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists duas (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references dua_categories(id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  slug text unique not null,
  text_ar text not null,
  text_en text,
  occasion_ar text,
  occasion_en text,
  source_ar text,
  source_en text,
  benefits_ar text,
  benefits_en text,
  published boolean default true,
  searchable tsvector generated always as (to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(text_ar,''))) stored,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Guard: ensure generated column and index exist on pre-existing duas tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'duas' AND column_name = 'searchable'
  ) THEN
    ALTER TABLE public.duas
      ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(text_ar,''))
      ) STORED;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'duas_search_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX duas_search_idx ON public.duas USING gin (searchable);
  END IF;
END $$;
create index if not exists duas_category_idx on duas(category_id);

-- Articles Tables
create table if not exists article_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  description_ar text,
  description_en text,
  icon text,
  published boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references article_categories(id) on delete cascade,
  title text not null,
  slug text unique not null,
  content text not null,
  summary text,
  author text,
  featured_image_url text,
  tags text[] default '{}',
  published boolean default true,
  views integer default 0,
  searchable tsvector generated always as (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))) stored,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Guard: ensure generated column and index exist on pre-existing articles tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'searchable'
  ) THEN
    ALTER TABLE public.articles
      ADD COLUMN searchable tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))
      ) STORED;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'articles_search_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX articles_search_idx ON public.articles USING gin (searchable);
  END IF;
END $$;
create index if not exists articles_category_idx on articles(category_id);
create index if not exists articles_slug_idx on articles(slug);

-- Videos Tables
create table if not exists video_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  description_ar text,
  description_en text,
  icon text,
  published boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references video_categories(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text,
  youtube_id text,
  thumbnail_url text,
  duration integer,
  views integer default 0,
  published boolean default true,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists videos_category_idx on videos(category_id);
create index if not exists videos_youtube_id_idx on videos(youtube_id);
create index if not exists videos_slug_idx on videos(slug);

-- Kids Content Table
create table if not exists kids_content (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  slug text unique not null,
  type text not null check (type in ('story', 'prayer', 'wudu', 'quiz', 'game', 'video')),
  content_ar text,
  content_en text,
  age_group text not null check (age_group in ('3-5', '6-8', '9-12', '13-15')),
  featured_image_url text,
  video_url text,
  quiz_data jsonb,
  published boolean default true,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists kids_content_type_idx on kids_content(type);
create index if not exists kids_content_age_idx on kids_content(age_group);
create index if not exists kids_content_slug_idx on kids_content(slug);

-- Prophets Tables
create table if not exists prophets (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  order_num integer,
  bio_ar text,
  bio_en text,
  birth_place_ar text,
  birth_place_en text,
  death_place_ar text,
  death_place_en text,
  featured_image_url text,
  thumbnail_url text,
  published boolean default true,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists prophet_sections (
  id uuid primary key default gen_random_uuid(),
  prophet_id uuid not null references prophets(id) on delete cascade,
  title_ar text not null,
  title_en text not null,
  content_ar text not null,
  content_en text,
  section_type text check (section_type in ('biography', 'miracles', 'teachings', 'stories', 'legacy')),
  order_num integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists prophets_slug_idx on prophets(slug);
create index if not exists prophets_order_idx on prophets(order_num);
create index if not exists prophet_sections_prophet_idx on prophet_sections(prophet_id);

-- Enable RLS for all new tables
alter table dua_categories enable row level security;
alter table duas enable row level security;
alter table article_categories enable row level security;
alter table articles enable row level security;
alter table video_categories enable row level security;
alter table videos enable row level security;
alter table kids_content enable row level security;
alter table prophets enable row level security;
alter table prophet_sections enable row level security;

-- Public read policies for content tables
create policy "dua_categories_public_read" on dua_categories for select using (published = true);
create policy "duas_public_read" on duas for select using (published = true);
create policy "article_categories_public_read" on article_categories for select using (published = true);
create policy "articles_public_read" on articles for select using (published = true);
create policy "video_categories_public_read" on video_categories for select using (published = true);
create policy "videos_public_read" on videos for select using (published = true);
create policy "kids_content_public_read" on kids_content for select using (published = true);
create policy "prophets_public_read" on prophets for select using (published = true);
create policy "prophet_sections_public_read" on prophet_sections for select using (true);

-- Admin write policies for content tables
create policy "dua_categories_admin_write" on dua_categories for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "duas_admin_write" on duas for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "article_categories_admin_write" on article_categories for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "articles_admin_write" on articles for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "video_categories_admin_write" on video_categories for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "videos_admin_write" on videos for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "kids_content_admin_write" on kids_content for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "prophets_admin_write" on prophets for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
create policy "prophet_sections_admin_write" on prophet_sections for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin')) with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));

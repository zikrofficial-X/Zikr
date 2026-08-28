import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Starting comprehensive fix for missing modules...');

    // 1. Article Categories
    console.log('Creating article_categories...');
    await sql.unsafe(`
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
    `);

    // 2. Articles
    console.log('Creating articles and fixing columns...');
    await sql.unsafe(`
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
        metadata jsonb default '{}',
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      );
    `);
    
    await sql.unsafe(`
      ALTER TABLE articles 
      ADD COLUMN IF NOT EXISTS searchable tsvector 
      GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))) STORED;
    `);
    
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS articles_search_idx ON articles USING GIN (searchable);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS articles_category_idx ON articles(category_id);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles(slug);`);

    // 3. Video Categories & Videos (Already partly exist, but let's ensure)
    console.log('Ensuring video tables...');
    await sql.unsafe(`
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
    `);
    
    await sql.unsafe(`
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
    `);
    
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS videos_category_idx ON videos(category_id);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS videos_youtube_id_idx ON videos(youtube_id);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS videos_slug_idx ON videos(slug);`);

    // 4. Prophets & Prophet Sections
    console.log('Creating prophets and sections...');
    await sql.unsafe(`
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
    `);
    
    await sql.unsafe(`
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
    `);
    
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS prophets_slug_idx ON prophets(slug);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS prophets_order_idx ON prophets(order_num);`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS prophet_sections_prophet_idx ON prophet_sections(prophet_id);`);

    console.log('All missing modules fixed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing missing modules:', error);
    process.exit(1);
  }
}

main();

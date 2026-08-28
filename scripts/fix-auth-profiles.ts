import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('Ensuring profiles table exists...');
    await sql.unsafe(`
      create table if not exists public.profiles (
        id uuid primary key references auth.users on delete cascade,
        display_name text,
        avatar_url text,
        role text default 'user' check (role in ('user', 'admin')),
        locale text default 'ar',
        metadata jsonb default '{}',
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      );
    `);

    console.log('Enabling RLS on profiles...');
    await sql.unsafe(`ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`);

    console.log('Creating profile trigger function...');
    await sql.unsafe(`
      create or replace function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer
      as $$
      begin
        insert into public.profiles (id, display_name, locale)
        values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'ar')
        on conflict (id) do nothing;
        return new;
      end;
      $$;
    `);

    console.log('Creating profile trigger...');
    await sql.unsafe(`
      drop trigger if exists on_auth_user_created on auth.users;
      create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
    `);

    console.log('Applying profile RLS policies...');
    await sql.unsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_own' AND tablename = 'profiles') THEN
              CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN
              CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
          END IF;
      END $$;
    `);

    console.log('Auth profiles and triggers fixed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing auth profiles:', error);
    process.exit(1);
  }
}

main();

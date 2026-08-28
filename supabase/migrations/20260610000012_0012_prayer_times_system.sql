-- Phase: Prayer Times System
-- Description: Create tables for prayer times, locations, preferences, and notifications

-- Prayer locations table (stores user's saved prayer locations)
create table if not exists prayer_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  city text not null,
  country text,
  latitude numeric,
  longitude numeric,
  timezone text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prayer preferences table (user's prayer settings)
create table if not exists prayer_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  calculation_method text default 'umm-al-qura', -- umm-al-qura, isna, mwl, karachi, diyanet, etc.
  madhab text default 'shafi', -- shafi, hanafi, maliki, hanbali
  high_latitude_method text default 'middle-of-night', -- middle-of-night, one-seventh, angle-based
  asr_method text default 'shafi', -- shafi, hanafi
  midnight_method text default 'standard', -- standard, jafari
  notifications_enabled boolean default true,
  adhan_enabled boolean default true,
  adhan_volume integer default 70,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prayer notifications table (tracks notification history)
create table if not exists prayer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  prayer_name text not null, -- fajr, sunrise, dhuhr, asr, maghrib, isha
  notification_time timestamptz not null,
  sent_at timestamptz,
  status text default 'pending', -- pending, sent, failed
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table prayer_locations enable row level security;
alter table prayer_preferences enable row level security;
alter table prayer_notifications enable row level security;

-- RLS Policies for prayer_locations
create policy "prayer_locations_owner_all" on prayer_locations
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policies for prayer_preferences
create policy "prayer_preferences_owner_all" on prayer_preferences
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policies for prayer_notifications
create policy "prayer_notifications_owner_read" on prayer_notifications
  for select using (auth.uid() = user_id);

create policy "prayer_notifications_owner_insert" on prayer_notifications
  for insert with check (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists prayer_locations_user_id_idx on prayer_locations(user_id);
create index if not exists prayer_locations_default_idx on prayer_locations(user_id, is_default);
create index if not exists prayer_preferences_user_id_idx on prayer_preferences(user_id);
create index if not exists prayer_notifications_user_id_idx on prayer_notifications(user_id);
create index if not exists prayer_notifications_prayer_idx on prayer_notifications(prayer_name, notification_time);

-- Trigger to auto-update updated_at columns
create trigger update_prayer_locations_updated_at before update on prayer_locations
  for each row execute function public.update_updated_at_column();

create trigger update_prayer_preferences_updated_at before update on prayer_preferences
  for each row execute function public.update_updated_at_column();

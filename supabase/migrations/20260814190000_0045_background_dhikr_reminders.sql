-- Persist opt-in dhikr and salawat schedules for server-side push delivery.
create table if not exists public.background_reminder_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  dhikr_enabled boolean not null default false,
  dhikr_interval_minutes integer not null default 60 check (dhikr_interval_minutes in (15, 30, 60, 120)),
  salawat_enabled boolean not null default false,
  salawat_interval_minutes integer not null default 60 check (salawat_interval_minutes in (15, 30, 60, 120)),
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

alter table public.background_reminder_preferences enable row level security;
drop policy if exists background_reminder_preferences_select_own on public.background_reminder_preferences;
drop policy if exists background_reminder_preferences_insert_own on public.background_reminder_preferences;
drop policy if exists background_reminder_preferences_update_own on public.background_reminder_preferences;
create policy background_reminder_preferences_select_own on public.background_reminder_preferences for select using ((select auth.uid()) = user_id);
create policy background_reminder_preferences_insert_own on public.background_reminder_preferences for insert with check ((select auth.uid()) = user_id);
create policy background_reminder_preferences_update_own on public.background_reminder_preferences for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.prayer_notification_deliveries drop constraint if exists prayer_notification_deliveries_prayer_name_check;
alter table public.prayer_notification_deliveries add constraint prayer_notification_deliveries_prayer_name_check check (prayer_name in ('Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Dhikr', 'Salawat'));
alter table public.prayer_notification_deliveries add column if not exists notification_kind text not null default 'prayer' check (notification_kind in ('prayer', 'dhikr', 'salawat'));
alter table public.prayer_notification_deliveries add column if not exists notification_text text;

create unique index if not exists prayer_delivery_kind_schedule_idx on public.prayer_notification_deliveries(push_subscription_id, notification_kind, scheduled_at);

-- Reuse the existing minute dispatcher; this function only creates due-window rows.
create or replace function public.plan_background_reminder_deliveries(now_at timestamptz default now()) returns integer
language plpgsql security definer set search_path = public as $$
declare inserted_count integer := 0; begin
  insert into public.prayer_notification_deliveries (user_id, push_subscription_id, prayer_name, notification_kind, notification_text, scheduled_at)
  select s.user_id, s.id, case when p.kind = 'dhikr' then 'Dhikr' else 'Salawat' end, p.kind,
    case when p.kind = 'dhikr' then 'سبحان الله وبحمده، سبحان الله العظيم' else 'اللهم صل وسلم على نبينا محمد' end,
    date_trunc('minute', now_at) + (p.interval_minutes * floor(extract(epoch from (now_at - date_trunc('day', now_at))) / 60 / p.interval_minutes + 1)) * interval '1 minute'
  from public.push_subscriptions s
  join public.background_reminder_preferences r on r.user_id = s.user_id
  cross join lateral (values
    ('dhikr'::text, r.dhikr_enabled, r.dhikr_interval_minutes),
    ('salawat'::text, r.salawat_enabled, r.salawat_interval_minutes)
  ) p(kind, enabled, interval_minutes)
  where s.is_active and p.enabled and p.interval_minutes > 0
  on conflict (push_subscription_id, notification_kind, scheduled_at) do nothing;
  get diagnostics inserted_count = row_count; return inserted_count;
end; $$;
revoke all on function public.plan_background_reminder_deliveries(timestamptz) from public, anon, authenticated;
grant execute on function public.plan_background_reminder_deliveries(timestamptz) to service_role;

-- Cover the achievement foreign key for efficient joins and cascading deletes.
create index if not exists kids_user_achievements_achievement_idx
  on public.kids_user_achievements (achievement_id);

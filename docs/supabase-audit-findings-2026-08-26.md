# Supabase audit findings — 2026-08-26

## Project

- Project: Zikr
- Project ref: `eydxvcamhjhajxjrsgym`
- Status: `ACTIVE_HEALTHY`
- PostgreSQL: 17.6.1.104

## Remote schema

- Public tables were listed with columns, primary keys, foreign keys, and RLS state.
- Public content tables and user-data tables have RLS enabled in the inspected schema.
- Local migration verification reports 158 canonical migrations with no duplicate versions and all migration replay checks passing.

## Security advisor findings

1. `auth_leaked_password_protection`: WARN — leaked password protection is disabled. This is an Auth dashboard/project setting and is not changed by a SQL migration. It should be enabled in Supabase Auth settings after confirming it is compatible with the product's password policy.
2. `extension_in_public`: WARN — `pg_net` is installed in the `public` extension namespace.

The live database exposes `net.http_post`, `net.http_get`, and `net.http_delete`. Supabase's official pg_net documentation uses these `net.*` APIs. Supabase's current GitHub issue #46919 documents that managed pg_net can be non-relocatable (`extrelocatable=false`), so blindly running `ALTER EXTENSION pg_net SET SCHEMA extensions` is unsafe and may fail or break cron/webhook calls. No destructive extension move was applied.

## Performance advisor findings

The remote advisor reports INFO-level unused-index notices for several tables, including prophets, kids_content, content_agent_sources, content_agent_queue, generated_research, hadith_explanations, payments, reminders, research_requests, saved_stories, stories, story_progress, tasks, user_behavior, conquests, pinned_messages, companions, and other tables. These are advisory observations, not runtime errors. Dropping them without representative production workload evidence would risk regressions; they were not removed.

## Sources

- Supabase pg_net documentation: https://supabase.com/docs/guides/database/extensions/pg_net
- Supabase extensions overview: https://supabase.com/docs/guides/database/extensions
- Supabase issue on managed pg_net relocation: https://github.com/supabase/supabase/issues/46919

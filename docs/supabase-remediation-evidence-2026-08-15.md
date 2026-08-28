# Supabase remediation evidence — 2026-08-15

## Migration synchronization

The repository contained 125 tracked SQL migrations before the RLS cleanup. Supabase production contained the same 125 versions at the reconciliation point. The cleanup migration `20260815115851_cleanup_multiple_permissive_policies.sql` was applied successfully. A targeted follow-up migration, `20260815120950_remove_video_categories_policy_overlap.sql`, was then applied successfully after the advisor identified one remaining duplicate policy. Production now contains 127 migration versions, and both new local files are present in the repository working tree pending commit.

## RLS inventory

All inspected public/private application tables had `relrowsecurity = true`. Force RLS was enabled on the most sensitive user/profile and internal scheduler tables, including profiles, prayer locations, prayer preferences, prayer notifications, and social publish queue. Public content tables used published/active predicates. User tables used `auth.uid()` ownership predicates.

## RLS remediation

The official Supabase performance advisor initially reported multiple permissive policies on 35 tables, including content tables with admin `ALL` policies overlapping public `SELECT` policies, and duplicate owner policies on reading progress, recitations, favorites, reminders, playlists, subscriptions, and social publish queue. Migration `cleanup_multiple_permissive_policies` was applied successfully. It split admin policies into command-specific INSERT/UPDATE/DELETE policies, removed redundant owner policies, merged public/owner playlist SELECT behavior, and retained one public subscription INSERT policy plus owner read/update/delete policies.

The follow-up advisor still found one overlap on `public.video_categories` for authenticated UPDATE: identical policies `admin_all_video_categories_update` and `update_video_categories`. Migration `20260815120950_remove_video_categories_policy_overlap.sql` removed only the redundant legacy policy. The retained policy continues to require `private.is_admin_user()` in both USING and WITH CHECK clauses, so authorization was not widened.

## Final advisor verification at 12:10 UTC

Security Advisor reports exactly two WARN items: `extension_in_public` for pg_net and `auth_leaked_password_protection`. Performance Advisor reports 98 findings, all `INFO`-level `unused_index` notices, and **zero** `multiple_permissive_policies` warnings.

The dashboard Attack Protection page showed CAPTCHA Disabled after an accidental unsaved toggle was reversed. No CAPTCHA secret was entered and no CAPTCHA setting was saved. Supabase's official password-security documentation states that leaked password protection is available on the Pro plan and above; this project is on the Free plan, so the setting cannot be enabled without a plan change. Existing Google OAuth and email authentication were not changed.

## pg_net evidence and official documentation

Production has pg_net version `0.20.0` with extension namespace `public`; its `http_post` function is in schema `net`. Both active pg_cron jobs call `net.http_post`: `zikr-prayer-push-dispatch` invokes the `prayer-notification-worker` Edge Function every minute and `zikr-video-processing` invokes the protected Vercel video-processing endpoint every minute. Both jobs had succeeded repeatedly through 12:00 UTC after the RLS cleanup.

The official pg_net documentation confirms that pg_net creates and uses the `net` schema and shows `net.http_post`. Moving the extension without a tested staging clone could break the active cron calls, so the public-schema advisor is recorded as an infrastructure/configuration warning until a safe Supabase-supported migration path is confirmed.

## Performance advisor and index policy

The remaining 98 performance findings are INFO-level `unused_index` notices. They affect indexes on currently empty or lightly used tables as well as content/search tables. They are not SQL failures and should not be dropped wholesale: several are legitimate future query indexes and removal could create regressions. They require workload-based review rather than blind deletion.

## Cron validation

The latest 40 cron runs for both jobs were `succeeded`, each returned `1 row`, and both jobs remained active with the intended `* * * * *` schedule.

## References

- [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security)
- [Supabase pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)
- [Supabase database linter — multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [Supabase scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase local development and migrations](https://supabase.com/docs/guides/local-development/cli-workflows)

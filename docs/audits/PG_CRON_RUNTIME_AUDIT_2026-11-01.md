# Supabase pg_cron Runtime Audit — 2026-11-01

Project: `ymxdswkaxafakugktsim`
Observation: read-only query of `cron.job`; no jobs were created, changed, enabled, or disabled.

| Job ID | Job name | Schedule | Current target | Active |
|---:|---|---|---|---|
| 1 | `zikr-prayer-push-dispatch` | Every minute | `https://ymxdswkaxafakugktsim.supabase.co/functions/v1/prayer-notification-worker` | Yes |
| 3 | `zikr-source-verified-content-agent` | Daily at 03:00 | `https://ymxdswkaxafakugktsim.supabase.co/functions/v1/source-verified-content-agent` | Yes |
| 5 | `zikr-youtube-facebook-sync` | Every 10 minutes | `https://ymxdswkaxafakugktsim.supabase.co/functions/v1/sync-youtube-facebook` | **No** |
| 6 | `zikr-cron-history-cleanup` | Daily at 03:30 | Internal SQL job; no HTTP target | Yes |

## Findings

- Every active HTTP cron target points to the canonical production Supabase project.
- The retired `sync-youtube-facebook` job remains in `cron.job` for history/compatibility but is disabled.
- No old Supabase project URL is present in an active cron job.
- Historical migration files that contain former endpoints are immutable and must not be rewritten after application. Future changes require forward migrations.
- GitHub Actions owns production video generation and social publishing; Supabase cron does not call the retired social sync worker.

## Validation limits

This audit confirms cron job definitions and active flags only. It does not prove that each scheduled invocation succeeds at runtime. Invocation history, function logs, and provider responses must be checked separately.

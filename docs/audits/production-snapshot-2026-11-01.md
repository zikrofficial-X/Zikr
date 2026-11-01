# ZIKR Production Stabilization Snapshot — 2026-11-01

## Scope and safety

- Repository: `zikrofficial-X/Zikr`
- Production branch baseline: `main` at `9e429094ae9f296f1d2875d1d2a648148e7a7f9d`
- Repair branch: `codex/zikr-comprehensive-repair-2026-11-01`
- Supabase project: `ymxdswkaxafakugktsim`
- Supabase status: `ACTIVE_HEALTHY`
- Database engine: PostgreSQL 17.11.0.003
- Snapshot observation time: 2026-11-01 12:37 UTC (read-only metadata queries)

No production rows, objects, tables, policies, or migration history were modified during this snapshot. No destructive migration was applied.

## Repository and migration ledger

| Check | Result |
|---|---:|
| Local SQL migration files at baseline | 388 |
| Production migration ledger entries | 388 |
| Local versions missing remotely | 0 |
| Remote versions missing locally | 0 |
| Latest production migration | `20261101090000_harden_kids_game_result_insert_contract` |

The local migration version set and the production ledger version set matched exactly at snapshot time. The two entries named `video_storage_retention_rpc` are distinct, documented versions; the earlier file is explicitly a compatibility mirror. Applied migration files must remain immutable.

## Database access controls

| Check | Result |
|---|---:|
| Application tables in `public` and `private` | 86 |
| Tables with RLS enabled | 86 |
| Tables with RLS disabled | 0 |
| Tables with no RLS policy | 0 |
| Application tables in `private` | 0 |

The `private` schema exists, but the current application table inventory is in `public`. This is an architecture-review item for the database canonicalization/security phases, not authorization to move tables automatically. Table moves require a dependency and grant review.

There are 27 zero-row public tables in this snapshot. Zero rows alone do not establish that a table is unused; keep/retire decisions require source, RPC, trigger, policy, and migration dependency tracing.

## Storage metadata

Nine buckets were configured. The metadata query found:

| Bucket | Objects | Metadata bytes |
|---|---:|---:|
| `videos` | 136 | 463,283,289 |
| `android-releases` | 12 | 216,722,808 |
| **Total observed** | **148** | **680,006,097** |

The total is approximately 648.5 MiB based on `storage.objects.metadata.size`; it is not a billing export and does not include provider-side overhead. The other seven configured buckets contain zero objects. No objects were deleted as part of this snapshot.

## Supabase advisors

- Security: one warning — leaked-password protection is disabled.
- Performance: 65 informational unused-index findings.
- Unused-index findings are not deletion instructions. Query workload and retention windows must be reviewed before any index is removed.
- Leaked-password protection is an account/project security setting and must be enabled only after checking the plan and current Auth configuration.

## Backup limitation

This record is a read-only metadata and migration-ledger snapshot. The available connected Supabase actions did not expose a database `pg_dump`/physical backup or a full storage-object export. Therefore this file is **not** a recoverable production backup.

Before any database schema migration or table retirement, obtain and verify:
1. A Supabase-managed database backup/PITR restore point or an independently verified logical dump.
2. A storage object inventory export including bucket, path, size, MIME type, checksum/ETag, and metadata.
3. The migration ledger and the current Git commit SHA (recorded above).

Do not proceed with destructive schema or storage operations until those recovery artifacts are confirmed.

## Open stabilization gates

- [ ] Verify a recoverable database backup/PITR point or logical dump.
- [ ] Export full storage object metadata and verify checksums where available.
- [ ] Inspect policies/grants for privileged tables and security-definer functions.
- [ ] Reconcile the leaked-password protection warning with the available Supabase plan.
- [ ] Review all 65 unused-index notices against query plans and production workload.
- [ ] Complete file-by-file repository status matrix and architecture dependency map.
- [ ] Complete route, browser, and physical Android device acceptance.

## Kids production catalogue

Live production queries on 2026-11-01 confirmed:

- `public.kids_games`: **13** published game records; IDs/order match the current canonical registry, with order indexes 1–13.
- `public.kids_game_levels`: **1,170** published level rows: 13 games × 3 difficulties × 30 levels.
- Every game has exactly 30 levels for `easy`, `normal`, and `hard`, numbered 1–30.
- All 13 `cover_url` fields are currently `NULL`. This is a metadata/artwork-catalogue gap only; the web game cards use the in-repository game-art components and asset manifest. Do not bulk-write guessed cover URLs.

These checks confirm that the earlier 12-game snapshot is stale; production and the current registry now both contain 13 games.

## Social publishing queue

Live production query on 2026-11-01:

- `published`: **286** records (oldest 2026-10-15, newest 2026-10-30).
- `queued`: **103** records (oldest 2026-10-29, newest 2026-11-01).
- All 103 queued records target both YouTube and Facebook Reels.
- 98 queued rows have `scheduled_at IS NULL`; 5 have explicit scheduled timestamps around 2026-10-30 21:27 UTC.
- The GitHub publisher is currently fail-closed (`SOCIAL_PUBLISH_ENABLED=false`); no new posts were sent by the disabled runs.

Do not enable publishing as a generic repair step: that could release the 103-item backlog to public accounts. Before activation, review and approve the backlog, define a publish cadence, and verify the current provider cooldown/partial-delivery state. No queue records were changed.

## Anonymous table grants — security finding

A direct ACL inspection found 28 private or user-scoped tables with explicit table privileges granted to the `anon` role. The matching RLS policies currently deny anonymous access or require `auth.uid()` ownership, so the audit did not establish an anonymous row-read path. However, these grants are unnecessary and create avoidable exposure if a policy is later weakened.

The repair branch adds migration `20261101135000_revoke_anon_privileges_private_tables.sql`, which revokes all table privileges from `anon` on the 28 affected tables only. The same migration separates the `hadiths`, `stories`, and `scholars` read policies into published-only anonymous access and published-or-admin authenticated access, then revokes anonymous execution of the `SECURITY DEFINER` function `private.is_admin_user()`. It preserves authenticated admin access and `service_role` privileges and does not modify data. This migration has **not** been applied to production as of this snapshot; production verification is required after the controlled release migration step.

### Admin-role escalation check

- `profiles.role` is an enum (`user`, `admin`), but the live `guard_profile_sensitive_fields` trigger resets role to `user` on user inserts and rejects authenticated changes to `role` or `email`.
- `admin_role_assignments` insert/update/delete policies require `super_admin`; select is self-or-admin.
- `private.is_admin_user()` is `SECURITY DEFINER` with an empty `search_path`, and its body delegates to the role-check function. Its execute grant included `anon`; anonymous callers have no authenticated UID and the function only returns a boolean. The repair migration replaces the three public-read policies that referenced it with explicit anonymous published-only and authenticated admin-aware policies, then revokes the unnecessary anon execute grant.

## Supabase scheduler ownership and live cron targets

Live `cron.job` inspection on the canonical project `ymxdswkaxafakugktsim` confirmed:

| Job | Schedule | Active | Target |
|---|---|---:|---|
| `zikr-prayer-push-dispatch` | Every minute | Yes | `prayer-notification-worker` on `ymxdswkaxafakugktsim` |
| `zikr-source-verified-content-agent` | Daily 03:00 UTC | Yes | `source-verified-content-agent` on `ymxdswkaxafakugktsim` |
| `zikr-cron-history-cleanup` | Daily 03:30 UTC | Yes | Local `cron.job_run_details` retention cleanup (3 days) |
| `zikr-youtube-facebook-sync` | Every 10 minutes | **No** | Legacy `sync-youtube-facebook` function; inactive |

All active HTTP cron targets use the canonical current Supabase project. Two older migration files still contain the previous project reference, but applied migration files are historical and remain immutable; the live cron rows were repointed by later migrations. Do not re-enable the legacy social sync cron: GitHub Actions owns the current social publisher.

## Production deployment and main-branch status

At the time of this snapshot, Vercel's latest production deployment was:

- Deployment: `dpl_AMvvdg7hTG7bZyh4PNRogwGXgt8m` — READY.
- Git ref/SHA: `main` / `9e429094ae9f296f1d2875d1d2a648148e7a7f9d`.
- Aliases: `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, and `zikr-git-main-zikr3.vercel.app`.
- Vercel project/team: `prj_bnBQb7DIXB5iE2mZJAghtAoZuKGs` / `team_RxPjmgZoSFmKGjScefYmwIVv`.

The GitHub combined status for that exact main commit was `success` with three attached checks: CircleCI `application-build-docs`, Vercel, and CircleCI `config-guard`. An English content-sync failure had been observed on an earlier commit; the scheduled standalone sync run is not represented in the current commit status and its latest result was not available through the connected actions.

The repair branch is not yet the production deployment. The controlled release workflow is manual-only and requires an explicit `RELEASE` dispatch on `main`; merging the PR does not auto-deploy.

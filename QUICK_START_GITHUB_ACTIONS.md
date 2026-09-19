# Zikr quick start: GitHub Actions and production automation

## Important architecture note

GitHub Actions is **not** the production scheduler for Zikr. Production prayer notifications are owned by Supabase `pg_cron` → `prayer-notification-worker`. Video/social processing is currently a manual GitHub Background Jobs recovery workflow while hosted runners are unavailable. Vercel runs `pnpm verify` as the application build gate.

The GitHub workflows are manual-only because the GitHub account currently has a billing lock that prevents hosted runners from starting. Keep them available for recovery, but do not treat a successful workflow file parse or an enabled workflow as evidence that production scheduling is active.

## Verify the repository locally

From the repository root, run:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

The verification command is the same gate configured in `vercel.json`. It covers migration checks, route and import checks, linting, TypeScript, tests, and the production build.

## Run the CI fallback manually

After GitHub runner access is restored, dispatch the verification workflow from the Actions tab or with:

```bash
gh workflow run ci.yml --repo Zikrmediaofficial/Zikr
```

The workflow installs the frozen lockfile and runs `pnpm verify`. If GitHub reports an account billing lock, do not repeatedly rerun it; use the local command or inspect the Vercel deployment instead.

## Run queue recovery manually

The Background Jobs workflow is a recovery tool for a deliberate operator action. Its input is `target`, with one of these values:

| Input | Queue |
|---|---|
| `all` | Video and social queues |
| `videos` | Video generation and publishing queue |
| `social` | Social publishing queue |

Use the CLI form only when runner access and all required server-side secrets have been verified:

```bash
gh workflow run background-jobs.yml --repo Zikrmediaofficial/Zikr -f target=all
```

The previous `job_type` input is no longer valid. The workflow must never be changed back to `schedule` while the Supabase queue scheduler is active, because doing so can duplicate external publishing.

## Check production automation

Use the Supabase dashboard or the project’s operational SQL checks to confirm the active prayer scheduler `zikr-prayer-push-dispatch`. Do not expect or recreate the retired `zikr-video-processing` cron. Review recent `cron.job_run_details`, Edge Function logs, the prayer delivery ledger, and the video publish log. A GitHub Actions run is not a substitute for these checks.

For the public site, verify that the canonical domain is `https://zikrmediaofficial.vercel.app`, that the latest production deployment is `READY`, and that recent Vercel runtime logs contain no error-level entries. Deployment protection may remain enabled for non-custom preview domains, but the canonical custom domain must remain reachable for users and OAuth callbacks.

## Secret handling

Never put service-role keys, OAuth refresh tokens, provider access tokens, VAPID private keys, or the scheduler secret in a browser bundle, README, issue, workflow output, or committed file. Production secrets belong in Vercel/Supabase server-side secret stores. GitHub secrets are required only for the manual recovery workflow and should not be copied from production into local shell history.

## Do not create a duplicate scheduler

Before adding or re-enabling any cron, identify the current owner, verify its authentication, and inspect its last runs. Zikr has one authoritative owner per automatic queue. The prayer worker and queue processing use idempotent controls; adding another scheduler would risk duplicate notifications or duplicate provider submissions.

## References

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Zikr GitHub Actions operations guide](GITHUB_ACTIONS_MIGRATION_GUIDE.md)
- [Zikr production scheduling runbook](docs/production-scheduling.md)
- [Zikr background jobs runbook](docs/background-jobs.md)

**Last updated:** August 15, 2026

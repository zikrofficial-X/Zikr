# GitHub Actions Billing and Free Alternatives Research — 15 Aug 2026

## Repository evidence

Repository: `mohamedalaa7785-cpu/Zikr`, public, default branch `main`.

The current workflows are intentionally manual-only:

- `.github/workflows/ci.yml` runs `pnpm verify` on `ubuntu-24.04` through `workflow_dispatch`.
- `.github/workflows/background-jobs.yml` runs `pnpm background:jobs` with Supabase, site, media, YouTube, Facebook, and HeyGen secrets through `workflow_dispatch`.
- Existing project behavior already runs `pnpm verify` during Vercel deployment builds.
- Production background work is already handled by active Supabase cron/Edge Function infrastructure; GitHub Actions is not the production scheduler in the current configuration.

The latest GitHub CLI run inspection showed failed runs with jobs completing in approximately 3–5 seconds and no job steps. This is consistent with a runner startup/account restriction rather than a TypeScript, dependency, or workflow-step failure. The repository workflow files themselves contain valid setup ordering: `pnpm/action-setup@v4` precedes `actions/setup-node@v4`.

## Authoritative GitHub findings

GitHub states that standard GitHub-hosted runners are free and unlimited for public repositories, while private repositories consume plan quotas; usage beyond quota can be billed. GitHub also states that usage is blocked when the account has no valid payment method and the included quota is exhausted. Sources:

- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job

GitHub’s current public documentation describes self-hosted runners as free to use with Actions, while the operator remains responsible for the machine. GitHub recommends caution with self-hosted runners for public repositories because pull requests from forks can execute workflow code on the runner. Sources:

- https://docs.github.com/actions/hosting-your-own-runners
- https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners

GitHub’s December 2025 pricing announcement said the planned March 2026 self-hosted platform charge was postponed, and that public repository runner usage remains free. Source:

- https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/

## Alternative platform findings

CircleCI’s official pricing page currently lists a Free plan with 30,000 credits per month, up to five active users, Linux/Arm/Docker execution, and five concurrent self-hosted runner tasks. CircleCI also states that qualifying open-source projects can access up to 400,000 credits per month. Source:

- https://circleci.com/pricing/
- https://circleci.com/docs/guides/plans-pricing/plan-overview/

Cloudflare Workers Free includes 100,000 requests per day and free request duration limits, but the free runtime is not a drop-in replacement for a Node.js `pnpm verify` job because it does not provide a general Linux build environment. It is a possible deterministic scheduler only after rewriting background work as a Worker and carefully fitting within runtime/API limits. Source:

- https://developers.cloudflare.com/workers/platform/pricing/

## Preliminary recommendation

The lowest-risk free arrangement is hybrid:

1. Keep Vercel deployment verification as the authoritative production build gate because it already executes `pnpm verify` and has the correct project secrets/runtime.
2. Keep Supabase cron/Edge Functions as the production scheduler for prayer notifications and video processing; do not move privileged background jobs into a public CI runner.
3. If GitHub Actions must execute again immediately, add a repository-level self-hosted runner on a trusted private machine and change `runs-on` to a dedicated label. Do not allow untrusted fork pull requests to run on it; retain protected-branch approval rules.
4. If the user wants hosted CI with no local machine, mirror the repository to CircleCI or GitLab and run a CI-only workflow there. Do not place production service-role secrets in the CI-only workflow unless the job is explicitly isolated and audited.
5. To restore GitHub-hosted runners, the account owner must resolve the account-level billing hold in GitHub Settings → Billing and plans: review payment method/invoices, Actions usage and budget, artifact/cache storage, and any account lock notice. A YAML change cannot bypass an account billing lock.

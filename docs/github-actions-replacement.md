# GitHub Actions Billing Lock and Free CI Replacement

## Executive conclusion

The repository workflows are not failing because of the ZIKR YAML or verification commands. The latest GitHub runs fail during runner startup, before any job step begins, which is consistent with the account-level message previously observed: `The job was not started because your account is locked due to a billing issue.` A workflow file cannot bypass an account lock.

For ZIKR, the safest free architecture is **hybrid**. Vercel continues to execute `pnpm verify` during deployments, Supabase remains the production scheduler for privileged background work, and CircleCI can run the same CI-only verification command independently of GitHub Actions. The new `.circleci/config.yml` intentionally contains no production secrets.

## What the lock means

GitHub’s official billing documentation says standard GitHub-hosted runners are free and unlimited for public repositories, but it also says usage can be blocked when an account has exhausted quota without a valid payment method. The repository is public, so the lock is not explained by ordinary public-runner pricing; it is an account-level billing/eligibility state that must be inspected in the account billing UI. The CLI can show failed runs but does not expose the private billing case details.

The run evidence is distinctive: jobs finish in a few seconds, have no recorded steps, and are marked failed/startup-failed. That means the runner was not provisioned. It is not evidence of a failed `pnpm install`, TypeScript error, test failure, or Supabase query.

## How to resolve GitHub Actions directly

Open [GitHub Billing and plans](https://github.com/settings/billing) while signed into the owner account, then review the following areas in order:

| Area | What to inspect | Corrective action |
|---|---|---|
| Payment method and invoices | Failed payment, expired card, unpaid balance, or payment verification | Update the payment method and settle any outstanding invoice or account notice |
| Actions usage | Included minutes, artifact storage, cache storage, and any larger-runner usage | Remove unnecessary artifacts/caches and wait for usage/billing state to refresh |
| Budgets | A zero or restrictive Actions budget can stop metered use | Set a budget that allows the intended usage, or keep usage within the public-repository free policy |
| Repository settings | Actions disabled, restricted, or policy-limited | Confirm Actions is enabled and standard GitHub-hosted runners are allowed |
| Account notices | A banner or support case may require manual review | Follow the notice and contact GitHub Support if the lock remains after billing is corrected |

Do not add a card merely to test randomly. First inspect the exact invoice, payment, quota, and budget message. For a public repository using standard Linux runners, the expected target is ordinary public-repository runner eligibility, not a paid larger runner.

After correcting the account state, manually run the `Continuous Integration` workflow from the Actions tab. Then run `Background Jobs` only after confirming all required repository secrets exist. The workflow files currently use `workflow_dispatch` deliberately, so they will not generate recurring failures while the account remains locked.

## Free replacement now added

The repository now includes `.circleci/config.yml`. It performs the same CI verification command as `.github/workflows/ci.yml`:

1. Uses a Node 22.13-compatible CircleCI Linux container.
2. Installs pnpm 9.15.0.
3. Runs `pnpm install --frozen-lockfile`.
4. Runs `pnpm verify`, which covers migrations checks, route/import checks, mobile readiness, lint, TypeScript, tests, and production build.
5. Uses a lockfile-keyed pnpm cache only to reduce setup time.

To enable it, create or log into a CircleCI account, choose the GitHub repository `mohamedalaa7785-cpu/Zikr`, and let CircleCI read the committed `.circleci/config.yml`. No application code or Supabase secret is required for this CI-only job. CircleCI’s official pricing currently lists a Free plan with 30,000 credits per month; qualifying open-source projects may receive a larger open-source allowance. Confirm the account’s displayed allowance before relying on high-frequency runs.

## Does the replacement do the same job?

| Capability | GitHub Actions CI | CircleCI config added | Equivalent? |
|---|---|---|---|
| Checkout source | Yes | Yes | Yes |
| Node/pnpm setup | Node 22 + pnpm 9.15.0 | Node 22.13 image + pnpm 9.15.0 | Yes |
| Frozen dependency install | Yes | Yes | Yes |
| Full `pnpm verify` | Yes | Yes | Yes |
| GitHub Checks status | Native | CircleCI status/check integration | Functionally, after CircleCI GitHub integration is enabled |
| Pull-request gating | GitHub branch rules | Configure CircleCI required status check in GitHub | Yes, after configuration |
| Production secrets | Not needed for CI workflow | Not included | Safer |
| Scheduled privileged background jobs | Previously attempted in GitHub Actions | Not moved | Intentionally no |
| Supabase prayer/video production jobs | Not a safe CI responsibility | Remain in Supabase cron/Edge Functions | Yes, existing production path |

## Why background jobs should not be moved into the free CI replacement

The background workflow requires a Supabase service-role key and third-party publishing credentials. CI is optimized for finite build/test jobs, not guaranteed production scheduling. The current ZIKR production design already uses Supabase cron and the deployed Edge Function for prayer notifications and video processing. Moving those secrets into a second hosted CI provider would increase exposure and create duplicate scheduling risk. CircleCI should therefore be used only for verification unless a separate, security-reviewed migration is explicitly requested.

## Other options

A self-hosted GitHub runner on a trusted machine can run the existing GitHub workflow without GitHub-hosted runner capacity, but it requires an always-available machine and operational maintenance. GitHub warns that self-hosted runners are risky for public repositories because fork pull requests can execute code on the runner; therefore it should not be used for untrusted pull requests without strict approval and isolation.

Vercel is already the strongest no-new-service option for ZIKR because it runs `pnpm verify` during deployment and has the production environment. It is not a complete replacement for a GitHub Checks provider because it reports deployment/build status rather than a normal GitHub Actions workflow status. CircleCI fills that CI-status gap without moving privileged jobs.

Cloudflare Workers Free is suitable for small HTTP/cron functions, but it is not a drop-in Linux environment for `pnpm verify`. Rewriting ZIKR’s background jobs there would be a separate architecture project and is not necessary while Supabase cron is healthy.

## References

[1]: https://docs.github.com/en/actions/concepts/billing-and-usage "GitHub Actions billing and usage"

[2]: https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions "About billing for GitHub Actions"

[3]: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job "Choosing a runner for a job"

[4]: https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners "Adding self-hosted runners"

[5]: https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/ "GitHub Actions pricing update and postponement"

[6]: https://circleci.com/pricing/ "CircleCI pricing"

[7]: https://circleci.com/docs/guides/plans-pricing/plan-overview/ "CircleCI plan overview"

[8]: https://developers.cloudflare.com/workers/platform/pricing/ "Cloudflare Workers pricing"

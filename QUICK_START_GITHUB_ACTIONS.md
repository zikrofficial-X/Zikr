# GitHub Actions — retired for billing control

GitHub Actions workflows were removed from this repository on 2026-09-19 after GitHub rejected hosted-runner jobs because of an account-level billing/spending restriction.

## Current state

- `.github/workflows/` is intentionally absent.
- There are no GitHub Actions workflows in this repository that can start new hosted-runner jobs.
- There are no in-progress GitHub Actions runs in the repository.
- Application verification is handled by the existing external CI/deployment systems.
- Quran audio import and other formerly manual workflows are retained as scripts/configuration in the repository and must be executed outside GitHub Actions if/when required.

## Do not recreate workflows

Do not add `push`, `pull_request`, `schedule`, `workflow_run`, or `workflow_dispatch` workflows to this repository while the billing restriction is unresolved.

GitHub Actions history and previous usage charges are not deleted by removing workflow files; this change only prevents new workflow executions from consuming hosted-runner minutes.

## Billing reference

The repository previously showed the GitHub error:

`The job was not started because recent account payments have failed or your spending limit needs to be increased.`

This was an account/billing execution restriction, not an application-code failure.

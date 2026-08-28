---
name: fullstack-project-overhaul
description: Comprehensive guide for reviewing, repairing, and preparing full-stack projects (especially Next.js/React + Supabase + Drizzle) for production. Use this skill when tasked with a complete project overhaul, fixing broken flows, syncing database schemas, or ensuring a project is production-ready without stopping for clarifications.
---

# Fullstack Project Overhaul

## Overview

This skill provides a systematic, end-to-end workflow for overhauling a full-stack project to make it production-ready. It is specifically tailored for projects using modern stacks (e.g., Next.js, React, Supabase, Drizzle ORM, Vercel) and emphasizes autonomous execution, comprehensive checks, and zero-downtime fixes without requiring constant user confirmation.

## Core Principles

1. **Autonomous Execution**: Do not stop to ask for clarification unless absolutely blocked. Fix issues directly.
2. **Comprehensive Review**: Do not just check what is asked; review the entire repository (schema, API routes, components, env vars, deployments).
3. **No Placeholders**: Ensure all features are connected to real data. Remove or implement any "mock" or "placeholder" code.
4. **Production Readiness**: The final deliverable must be a fully working, deployable project with no broken routes or missing configurations.

## Overhaul Workflow

Follow these steps sequentially to ensure a complete project overhaul.

### Step 1: Comprehensive Project Review

- **Scan the Repository**: Review all pages, components, `lib/services`, hooks, API routes, admin panels, auth flows, middleware, and database schemas.
- **Identify Gaps**: Look for missing pages, duplicated routes, incomplete data flows, broken state management, weak error handling, and leftover test/mock code.
- **Fix Issues**: Resolve any TypeScript errors, runtime bugs, build failures, hydration mismatches, accessibility issues, SEO gaps, performance bottlenecks, or route protection flaws.
- **Actionable Rule**: Do not leave any part "theoretically working." Everything must be connected to actual data or clearly structured if pending implementation.

### Step 2: Database & ORM Synchronization (Supabase + Drizzle)

- **Schema Comparison**: Compare the Drizzle schema (`schema.ts`) with the actual Supabase database tables.
- **Fix Drift**: Resolve any mismatch between the schema, migrations, and the actual database.
- **Validate Entities**: Ensure every used table has a correct definition. Verify relationships, indexes, constraints, RLS (Row Level Security) policies, and enums.
- **Column Matching**: Fix any mismatched column names or types between the code and the database.
- **Missing Tables/Migrations**: If tables or migrations are missing, create and apply them immediately.

### Step 3: End-to-End Feature Completion (e.g., Video Automation)

- **Review Core Systems**: For complex features (like automated video generation/publishing), review the entire pipeline from admin interfaces to API routes, background services, and database schemas.
- **Build the Pipeline**: Convert simple request management into a fully functional end-to-end pipeline:
  - Request creation and data validation.
  - Content generation/preparation.
  - State management in the database (e.g., Supabase).
  - Proper status updates.
  - Failure handling and retry mechanisms.
  - Automated publishing (e.g., YouTube, Facebook) if configured.
- **Complete Integrations**: If third-party APIs (like YouTube/Facebook) are incomplete, finish their implementation.
- **Background Jobs**: Implement necessary cron jobs or background workflows for automated tasks; do not leave them as mere environment flags.
- **Admin Visibility**: Ensure the admin panel reflects true statuses, allows retries, and clearly displays errors.

### Step 4: Environment Configuration Setup

- **Review Env Files**: Check `.env.example`, `.env.local.example`, documentation, and deployment configs (e.g., Vercel).
- **Validate Variables**: Ensure all required variables are present, optional ones are documented, and every variable is actually used in the code.
- **Fix Conflicts**: Resolve any naming conflicts between code, docs, and deployment configs.
- **Deployment Sync**: Verify that the deployment platform (e.g., Vercel) has all required variables for Production, Preview, and Development environments.
- **Clean Up**: Remove unused or duplicated variables. Replace placeholders in CI/CD or docs that could break builds.

### Step 5: Version Control & Deployment Workflow

- **Branch Sync**: Ensure the current working branch is synced correctly with the main branch and deployment flow.
- **CI/CD Review**: Check GitHub Actions, Vercel integrations, and deployment scripts.
- **Fix Workflows**: Repair any workflows relying on stubs, placeholders, or default secrets.
- **Validation**: Ensure build, test, and deployment validation steps pass without errors.

### Step 6: UI/UX and Missing Pages Completion

- **Review All Pages**: Check every route and page in the application.
- **Complete Content**: Replace placeholders or static content with real data connections.
- **Clean UI**: Merge or remove duplicated or useless sections.
- **Maintain Design System**: Preserve the existing visual identity, RTL support (if applicable), and primary language settings. Only change the core design if necessary to fix a bug or significantly improve UX.

### Step 7: Quality, Robustness, and Performance

- **State Handling**: Add or fix error boundaries, loading states, empty states, and fallback UI.
- **Permissions**: Verify user roles and permissions across routes and actions.
- **Clean Code**: Remove unnecessary `console.log` statements.
- **Performance**: Optimize heavy pages.
- **Consistency**: Ensure hooks, services, API routes, and server actions are compatible. DRY (Don't Repeat Yourself) the logic.
- **Testing**: Ensure any existing tests or scripts reflect the true state of the project.

## Final Acceptance Criteria

Before concluding the task, verify the following:
- The project works end-to-end.
- The build succeeds.
- Core pages load without errors.
- Admin panels are fully functional.
- The database is consistent and synced.
- Complex automated systems (if any) work correctly.
- Third-party integrations are properly configured.
- Environment variables are correctly set in deployment.
- No placeholders, drift, or theoretical implementations remain.

## Execution Rules

- **Direct Action**: Implement fixes directly in the code.
- **Concise Documentation**: Document changes briefly.
- **No Confirmation Needed**: Do not ask for user confirmation for every step.
- **No Repetition**: Do not repeat the same observation multiple times.
- **Deliverable**: Hand over a truly production-ready project.

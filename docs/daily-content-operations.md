# ZIKR Daily Content and Health Operations

## Purpose

ZIKR now has one active daily operation at **08:00 Africa/Cairo**. It reviews the production site, repository, Supabase, Vercel, authentication, scheduled jobs, content sections, PWA, and SEO. It may publish content or code changes only after source validation and successful checks.

The operation is intentionally conservative. It must preserve Quran and hadith source fidelity, attach a source URL or reference and retrieval date to imported material, deduplicate by stable identifiers or canonical slugs, and leave content unpublished when the source is unclear. It must never invent verses, hadiths, scholarly quotations, legal rulings, biographies, or historical claims.

## Active operation

| Setting | Value |
|---|---|
| Frequency | Daily |
| Timezone | `Africa/Cairo` |
| Time | 08:00 |
| Mode | Standard analysis with repository and production checks |
| Current task schedule | `ZIKR daily content, health, and repair` |
| Scope | GitHub, Supabase, Vercel, production routes, all content sections |
| Connectors | GitHub, Supabase API, Supabase, Vercel |
| Safety rule | No secrets in client code; no destructive database changes; no publication without a source |

## Content policy

Canonical Quran, translations, tafsir, recitations, and related data must come from an identified upstream provider. The Quran Foundation documentation describes server-side Content APIs for chapters, verses, translations, tafsir, audio, and search, and requires a registered backend application with its secret kept server-side. The integration must therefore be added only after the project has the required server-side credentials and permissions; an AI model is not an acceptable substitute for the upstream Quran source.

Hadith, dua, biography, battle, scholar, article, and video records must include the collection, book, publisher, scholar, or original URL in the record metadata or dedicated source field. A source that is only a search snippet is insufficient. The daily operation should prefer primary or publisher-controlled sources and must flag conflicting or weak reports for manual review instead of silently choosing one.

## Current production baseline

| Section | Total | Published |
|---|---:|---:|
| Articles | 26 | 26 |
| Prophets | 25 | 25 |
| Companions | 17 | 17 |
| Battles | 21 | 21 |
| Hadiths | 2,964 | 2,964 |
| Duas | 23 | 23 |
| Videos | 9 | 9 |
| Scholars | 8 | 8 |
| Tawasheeh | 4 | 4 |

The baseline is a measurement, not a promise to add arbitrary records every day. A day with no sufficiently verified new source is a successful safe run when it records the reason and completes the health checks.

## Required checks for each run

The operation must run the repository verification suite after code changes, inspect Supabase migrations and RLS before database changes, check active cron results, validate Google OAuth redirects without exposing credentials, inspect Vercel runtime errors for the current deployment, and run the production route audit. A failed check blocks publication and is reported with the root cause and next action.

## Manual release requirements

The Quran Foundation server credentials and any other provider credentials must be added only as server-side deployment environment variables. Before enabling a new upstream importer, add a schema-validation test, a source URL test, an idempotency test, and a migration replay test. Keep content imports separate from user-generated stories and from prayer/notification tables.

## References

[1]: https://quran.com/en/developers "Quran.com Developers"
[2]: https://api-docs.quran.foundation/ "Quran Foundation API Documentation"

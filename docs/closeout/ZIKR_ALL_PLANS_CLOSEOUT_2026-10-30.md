# ZIKR — All-Plans Engineering Closeout
**Checkpoint:** 2026-10-30  
**Repository:** `zikrofficial-X/Zikr`  
**Closeout branch:** `closeout/all-plans-2026-10-30`  
**Pull request:** [#150](https://github.com/zikrofficial-X/Zikr/pull/150)  
**Production origin:** https://zikrmediaofficial.vercel.app  
**Canonical Supabase project:** `ymxdswkaxafakugktsim`

> **Closeout state: engineering substantially implemented; final project certification remains open.** This ledger separates completed source/database work from production verification and from decisions or acceptance that require the owner, an educator, a qualified religious reviewer, a legal reviewer, or physical devices. A passing build, an open PR, or a READY deployment is not by itself proof that every plan is complete.

## 1. Verified technical baseline

| Area | Current evidence | Disposition |
|---|---|---|
| Main branch | PR #149 merged as `0adf4c3b701bbb18ec9d3bf674d972b7e0af5c39` | Merged |
| Main Quality Gate | Run #631 `41041147885`; full `pnpm verify` completed successfully | Passed |
| Current production deployment | `dpl_6A7XdBAjUWrMrp6KSxKKYtuTHSpw`, READY, exact main SHA `0adf4c3b701bbb18ec9d3bf674d972b7e0af5c39` | Verified deployed |
| Production aliases | `zikrmediaofficial.vercel.app`, `zikr-zikr3.vercel.app`, `zikr-git-main-zikr3.vercel.app` | Attached |
| Supabase | Project ACTIVE_HEALTHY; live ledger has 384 migration versions; latest `20261030110000` | Healthy / aligned at checkpoint |
| Admin RPC hardening | Public admin compatibility RPC recorded as SECURITY INVOKER; seven FK-support indexes present | Verified at prior reconciliation |
| Supabase Security Advisor | `auth_leaked_password_protection`: Leaked Password Protection Disabled | Open service setting |
| Supabase Performance Advisor | 68 unused-index observations, INFO | Monitor; do not bulk-delete |
| Runtime monitoring | React streaming-boundary errors still occur on article/dua detail routes; timeout cluster also observed on article route | Open production defect; fixes are in this PR, not yet certified live |
| Android stable release | `v1.1.8`, versionCode 62, signed APK/AAB and release metadata/checksums listed on GitHub Release | Published; branding update still needs next semantic release |

Evidence links: [PR #149](https://github.com/zikrofficial-X/Zikr/pull/149) · [Main commit](https://github.com/zikrofficial-X/Zikr/commit/0adf4c3b701bbb18ec9d3bf674d972b7e0af5c39) · [Vercel deployment](https://vercel.com/zikr3/zikr/6A7XdBAjUWrMrp6KSxKKYtuTHSpw) · [Android v1.1.8](https://github.com/zikrofficial-X/Zikr/releases/tag/v1.1.8).

## 2. New production defect repair in PR #150

The live Vercel runtime-error query showed two clusters:
- React streaming error `Aborted, errored or already flushed boundaries should not be flushed again`, five occurrences across `/articles/[slug]` and `/dua/[slug]`.
- Three historical 300-second timeouts on `/articles/[slug]`.

The live data review isolated concrete content-path conditions:
- Published dua `zikr-dua-expansion-14` has 69 Arabic characters; the route previously rejected anything under 80 characters, so valid published content returned not-found.
- 33 of 38 published articles had no English body. English requests mapped missing translations to empty title/content and returned not-found despite a complete Arabic canonical article.
- The dua route layout issued a second, separate metadata database request even though the page already fetched the same canonical row.

PR #150 now:
1. Resolves the actual article language and falls back to the published Arabic source when an English translation is missing.
2. Resolves dua detail content in English when available and otherwise displays the Arabic source with a clear notice.
3. Accepts short valid published duas from 10 characters, rather than applying the inappropriate 80-character threshold.
4. Removes the duplicate dua-layout metadata database call.
5. Adds production smoke cases for the short dua and English-to-Arabic fallbacks for both content types.

**Release boundary:** These source changes are on this branch. They are not production fixes until the current PR head passes its Quality Gate, merges, and the resulting main commit is deployed and smoke-tested. The older main deployment is not evidence that these changes are live.

## 3. Phase disposition — platform and video finalization plan

| Phase | Scope | Disposition | Remaining acceptance / evidence |
|---:|---|---|---|
| 0 | Freeze and rollback safety | Partly closed | Auto-publish/AI visual remain gated; verify complete backup/restore package and named rollback owner before destructive work. |
| 1 | Repository/file inventory | Partly closed | Route, feature, migrations and scripts have inventories; full dependency-proven file-by-file keep/merge/rewrite/delete matrix is not complete. |
| 2 | Architecture map | Partly closed | Core ownership and scheduler map exist; generated dependency graph across every runtime/dynamic entry point remains open. |
| 3 | Database canonicalization | Closed for current production migration alignment | 384 live migration entries; keep historical objects with dependencies until an approved retirement. |
| 4 | Migration repair | Closed for current ledger | Latest migration `20261030110000`; do not rewrite applied versions. Recheck after every future schema change. |
| 5 | Environment and secrets | Partly closed | Canonical project and required-secret checks exist; provider-by-provider owner/rotation attestation is not evidenced. Never print secret values. |
| 6 | Security | Partly closed | RBAC, RLS, service-only table controls and admin RPC hardening exist; enable leaked-password protection in Supabase Auth and rerun advisor. |
| 7 | Content canonicalization | Partly closed | Provenance and source contracts exist; independent editorial/religious verification of all public content is not evidenced. |
| 8 | Quran | Technically closed | Local canonical corpus has 114 surahs / 6,236 ayahs; production catalog has 19,608 Quran audio rows. Formal scholarly certification is external. |
| 9 | Voice Factory | Technically closed | Bounded TTS, voice/audio checks and source-safe Quran handling are implemented; retain human recitation for Quran and review sampled outputs. |
| 10 | Video Factory | Implemented; operationally gated | 375 generation requests completed; 9 pending, 1 processing, 1 retry-wait at this check. Confirm queue convergence and sample-review evidence. |
| 11 | AI Visual Factory | Implemented; production-paused | Live AI visual provider remains disabled. Provider, quota, cost ceiling, credentials and approval must be explicitly selected before enablement. |
| 12 | Video QA | Automated contracts implemented | Automated media/audio/codec checks exist; 363 historical outputs were not all newly human-reviewed in this checkpoint. |
| 13 | Scheduler | Closed for ownership/configuration | GitHub Actions owns video/social; Supabase pg_cron owns prayer and source-verified ingestion. No parallel Vercel cron should be added. |
| 14 | Social publishing | Partly closed; intentionally paused | 286 published; 5 partial rows had YouTube success with Facebook Reels deferred by provider cooldown. Retry only after explicit approval and valid Meta readiness. |
| 15 | Admin Video Factory | Technically closed | Protected source, queue, approval and publishing contracts exist; run browser acceptance for administrator roles and queue recovery. |
| 16 | Full Admin | Partly closed | Permission and API guards/audit contracts exist; browser-level acceptance for each role and sensitive action is open. |
| 17 | Content sections | Partly closed | Canonical sources, public routes and offline content exist; complete human editorial review and translation coverage remain open. |
| 18 | Kids platform | Source implementation substantially closed | Current registry has 13 games, not the older 12-game count. Device/gameplay, educator and religious-source review remain open. |
| 19 | Audio | Technically implemented | Quran, site audio and external recitation sources exist; end-to-end playback on supported phones/browsers remains open. |
| 20 | Prayer / Qibla | Partly closed | Prayer worker and timezone logic exist; validate location permissions and physical compass behavior on Android devices. |
| 21 | Auth | Partly closed | OAuth/callback/session contracts exist; leaked-password protection remains a Supabase Auth setting and requires advisor recheck. |
| 22 | Offline / PWA | Partly closed | Service worker, content packs and bounded IndexedDB result queue exist; airplane-mode/reconnect/duplicate-sync acceptance is open. |
| 23 | Mobile | Source/toolchain implemented | Android/iOS identity and packaging checks exist; device acceptance and store distribution are not proven by web CI. |
| 24 | SEO / AdSense / Search Console | Not closed | No custom domain is attached; prior low-value-content rejection requires substantive original content, domain decision, CMP/legal work and account-level review before reapplication. |
| 25 | Performance | Partly closed | Seven FK support indexes verified; 68 unused-index observations are INFO only. Review query workload before any index removal. |
| 26 | Observability | Partly closed | Health/queue alerts and runtime monitoring exist; React streaming errors remain under repair and alert-delivery/long-retention acceptance is open. |
| 27 | Testing | Automated source gates implemented | Main full gate passed; PR #150's current head still requires its own Quality Gate. Browser E2E and physical-device testing are separate gates. |
| 28 | CI/CD | Main gate closed; PR #150 pending | Main Quality Gate runs full `pnpm verify`; PRs run `pnpm verify:pr`. Close PR work only after latest head passes and post-merge main gate succeeds. |
| 29 | Production verification | Deployment identity verified; route-level acceptance incomplete | Vercel deployment is READY on the exact main SHA above. This is not a full route-by-route smoke certificate; rerun smoke after PR #150 deploys. |
| 30 | Cleanup | Partly closed | Retired runtime paths are documented; full per-file dependency evidence, storage retention/quota review and approved DB retirement remain required before destructive cleanup. |

## 4. Kids / Games — current acceptance

- Current application registry: **13 games**.
- Registry/content/navigation/difficulty/score/XP/offline contracts are covered by repository checks.
- The older 12-game inventory is superseded by the current 13-game registry.
- Do not mark Kids complete until a qualified educator reviews age fit, literacy progression and Letter Lab teaching method; a qualified religious reviewer checks source-sensitive content; and physical/browser play tests cover touch, keyboard, desktop, pause/restart/mute/difficulty/completion, authentication, offline results and reconnect sync.
- Asset-rights evidence for existing art/backgrounds also remains to be confirmed.

## 5. Growth, SEO, publishing and revenue plan

| Workstream | Current disposition |
|---|---|
| Admin analytics / publishing queue | Core dashboard, content search/filter/sort/actions, scheduling and analytics code are implemented; browser/role acceptance remains open. |
| Product analytics | Admin operational events exist; privacy-reviewed event definitions and independently verified Analytics/Search Console/YouTube Studio baselines are not evidenced. |
| Game growth | Discovery/progress foundations exist; caregiver/user usability study remains open. |
| Video distribution | Source-locked generation and QA exist; AI visual provider is paused and social publishing remains frozen. |
| Social backlog | Five partial Facebook Reels items remain deferred; owner must approve a retry window. |
| Domain / SEO | Vercel production origin is live; a custom domain has not been attached. Configure canonical/auth redirects after the owner selects a domain. |
| AdSense | Not ready to claim. The plan requires substantive original editorial pages, CMP/legal readiness for target countries and account-level Search Console/AdSense checks before reapplication. |
| Revenue | No commercial model has been launched. Owner must select donations, adult/family subscriptions, digital products or sponsorship and approve payment, refund, tax and legal terms. |
| Children's privacy / ads | Legal/policy review for target markets remains necessary; no child-tracking or aggressive child-facing advertising is approved by this closeout. |

## 6. Android and web release provenance

- Public Android stable release is **v1.1.8**, versionCode **62**, application ID `com.zikr.app`, target SDK 36. The published release lists signed APK, signed AAB, `SHA256SUMS` and `release-metadata.json`; CircleCI's Android rebuild and Supabase production gate succeeded for the release source commit.
- The immutable annotated `v1.1.8` tag resolves to `3bddc73c9d9c35c90b6c84d1a7bb825c0d1cc04e`, which predates the latest main branding commit by 229 commits. The published Android package therefore does **not** include the newer gold-crescent launcher artwork from PR #149.
- Do not retarget or overwrite the published tag/release. To distribute the new native identity, prepare the next semantic release (expected next patch after 1.1.8) through the Admin Release workflow, then require exact tag/source provenance, CircleCI signed APK/AAB success, byte/checksum verification and release publisher success.
- Historical v1.1.4 tag/source mismatch remains documented; Git tags v1.1.7/v1.1.8 are unsigned. APK/AAB signature verification is a separate control.
- Vercel Git auto-deployment is disabled. Production deployments must use the controlled release process and record exact main SHA, deployment ID, READY state and smoke evidence.

## 7. Outstanding owner / external gates

These cannot be truthfully closed by changing repository files alone:

1. Enable Supabase Auth leaked-password protection (feature requires Pro or above); rerun the Security Advisor afterward.
2. Educator sign-off for all 13 Kids games and qualified religious review for Quran/Hadith/dua/dhikr/wudu/source-sensitive content.
3. Physical game, audio, prayer/Qibla, PWA/offline/reconnect and mobile acceptance on the target Android devices; iOS acceptance where iOS is supported.
4. Browser E2E for public routes, auth, article/dua detail, audio, prayer, Kids result sync and privileged Admin actions.
5. Explicit disposition of the 5 Facebook Reels partial jobs and approval before any social workflow retry/enablement.
6. Owner decision for AI visual provider, credentials, quotas, cost ceiling and production enablement.
7. Owner choice of custom domain, plus DNS/Auth/canonical redirect and CMP/legal review for target countries.
8. Owner selection of a revenue model and completion of payment, refund, privacy and legal arrangements.
9. Storage quota and retention policy sign-off before deleting videos, release artifacts or historical records.
10. Full dependency proof and backup/rollback plan before retiring remaining legacy DB objects or removing unused assets.
11. Create and publish the next Android semantic release if native gold-crescent identity is to be distributed; v1.1.8 is immutable and older.
12. Review and remediate remaining production React streaming-boundary errors after the PR #150 release smoke, then confirm no recurrence in the supported observation window.

## 8. Final closure rule

This closeout becomes **engineering-merged** only when:
- PR #150's latest commit passes the PR Quality Gate;
- PR #150 is merged into `main`;
- the post-merge full main `pnpm verify` gate passes;
- the current main SHA is deployed to Vercel production and reaches READY;
- production smoke passes on the deployed artifact, including the article/dua regression checks;
- Supabase migration ledger and production health are rechecked after the release.

The wider project becomes **fully certified closed** only when the external/owner acceptance gates in §7 are signed off or explicitly accepted as deferred by the owner. Until then the accurate state is **core engineering implemented, production deployed at the recorded SHA, with named acceptance/security/commercial exceptions still open**.

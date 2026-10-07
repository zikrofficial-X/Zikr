# ZIKR — Supabase Free Migration / Quran Audio Finalization

**Date:** September 29, 2026

## 1. New Supabase Free project

- Organization: `zikr`
- Organization plan: Free
- Organization ID: `vercel_icfg_OSj2EHD4iDH5UdnZfWzOegIl`
- Project: `Zikrmediaofficial`
- Project ref: `nmdeazfmtncelykzxkhs`
- Region: `us-east-1`
- Postgres: 17.6.1.166
- Status at verification: ACTIVE_HEALTHY

The old `Zikr` project ref `eydxvcamhjhajxjrsgym` was preserved and not deleted by this migration work.

## 2. Database/content verification

Verified directly in the new project:

- Quran surahs: **114**
- Quran ayahs: **6,236**
- Quran reciter catalog rows: **172**
- Quran audio rows: **19,608**
- Reciters with complete 114-surah coverage: **172 / 172**
- Quran audio rows with external HTTPS `audio_url`: **19,608 / 19,608**
- Quran audio rows with missing URL: **0**
- Quran audio rows with Supabase Storage URL: **0**
- Quran audio rows with `storage_url`: **0**
- Quran audio rows with non-null `storage_bucket`: **0**
- Quran audio rows with `storage_status=ready`: **0**

The seven canonical reciters requested for the original ZIKR catalogue are present:

- Mishary Rashid Alafasy (`alafasy`)
- Muhammad Siddiq Al-Minshawi (`minshawi`)
- Maher Al-Muaiqly (`mahermuaiqly`)
- Saad Al-Ghamdi (`ghamdi`)
- Abdul Basit Abdul Samad (`abdulbasit`)
- Abdurrahman As-Sudais (`sudais`)
- Saud Al-Shuraim (`shuraim`)

## 3. Storage verification

The new project has **zero Storage objects and zero stored bytes** in all inspected buckets, including `quran-audio`.

The Free-plan design therefore does not copy the historical multi-GB Quran MP3 archive.

Quran playback is externalized through the `quran_audio.audio_url` field. The application code also rejects old Supabase Storage URLs and can derive an external URL from the reciter catalogue when required.

## 4. Application compatibility

The repository's current `src/features/quran/services/quran-server.ts` is compatible with the new storage architecture:

- local Quran corpus is preferred for Quran text;
- Supabase remains a compatibility fallback;
- direct external HTTPS `audio_url` values are accepted;
- old Supabase Storage URLs are not used for playback;
- Storage is not required for Quran audio playback.

The repository `.env.example` already points to:

```
NEXT_PUBLIC_SUPABASE_URL=https://nmdeazfmtncelykzxkhs.supabase.co
```

## 5. GitHub changes

Branch:

`chore/retire-quran-audio-storage-import`

Changes completed on this branch:

- removed CircleCI `run_quran_audio_import` parameter;
- removed the `quran-audio-import` CircleCI job;
- removed the `manual-quran-audio-import` workflow;
- removed `scripts/import-quran-audio-to-supabase.mjs`;
- updated production scheduling documentation;
- updated CircleCI/Supabase environment documentation;
- preserved the Free-plan external-audio architecture.

## 6. Vercel

Current verified Vercel project:

- Project ID: `prj_hRhHT6FUMXshDfzCnIh0aG0wpS1g`
- Team ID: `team_z2nBDHi0ppVAXj1cWzs7Qt5c`
- Repository: `zikr-org/Zikr`

Latest verified production deployment before this branch change:

`https://zikr-nnf7mj3oi-zikrcontact-7943.vercel.app`

The production homepage and Quran routes returned HTTP 200 through the Vercel access tool.

The connector available in this session does **not** expose Vercel environment-variable mutation, so this migration report does not claim that the Vercel Production environment variables were changed.

## 7. Remaining Vercel cutover

The Vercel Dashboard must point Production to the new Supabase project.

Required production values:

```
NEXT_PUBLIC_SUPABASE_URL=https://nmdeazfmtncelykzxkhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new project publishable/anon key>
```

Do not create a duplicate variable. The screenshot from the current Vercel connection flow showed the duplicate `NEXT_PUBLIC_SUPABASE_ANON_KEY` warning; the custom environment-variable prefix should remain empty.

After the environment values are confirmed, trigger a fresh Production deployment and verify runtime behavior.

## 8. Supabase advisor state

The new project still reports separate advisory items:

- leaked-password protection disabled;
- three RLS-enabled tables without policies;
- two RLS auth-initplan performance warnings;
- multiple unused-index notices.

These were intentionally not mass-modified during the migration because they are separate hardening work and broad automatic policy/index changes could alter application behavior.

## 9. Old project

The old project was not deleted or reset.

It remains the rollback source. Its former `quran-audio` archive was not copied into the new project.

## 10. Final status

**Supabase target project: verified and suitable for the Free-plan Quran-audio architecture.**

**Quran content/audio externalization: verified.**

**Old Quran Storage importer retirement: completed on GitHub branch.**

**Vercel Production environment cutover: not yet verified through the available connector and therefore not claimed complete.**

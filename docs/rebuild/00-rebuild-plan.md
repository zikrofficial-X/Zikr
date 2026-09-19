# ZIKR Clean Rebuild

## Goal
Rebuild ZIKR from the current GitHub codebase as source material while preserving useful behavior and production data, and removing structural duplication.

## Rules
- `main` remains untouched.
- Work only on `rebuild/clean-foundation-v2`.
- No production database reset or destructive data cleanup during source refactoring.
- Move one domain at a time.
- Keep public URLs stable.
- Keep privileged Supabase credentials server-only.
- Historical audits, repair scripts, and migration archives are evidence, not architecture.

## Target structure
```
src/
  app/          # routing only
  features/     # domain modules
  components/   # shared UI
  hooks/
  lib/          # infrastructure only
  styles/
public/
supabase/
scripts/
android/
ios/
docs/
```

## Domain order
Quran -> Hadith -> Adhkar/Dua -> Stories/Prophets/Companions/Scholars -> Articles/Videos/YouTube -> Audio/Reciters/Tawasheeh/Radio -> Prayer/Qibla/Tasbeeh/Memorization -> Auth/User -> Kids -> Admin/Social/Automation -> Offline/Mobile -> SEO/Production.

## Database strategy
The live Zikr Supabase project is the data source. The old migration chain is not copied blindly. We first match the live schema, RLS, functions, triggers, indexes, and runtime references, then maintain clean forward migrations.

## Definition of done
Each domain must have clean imports, explicit server/client boundaries, intentional loading/error behavior, tested critical paths, and no duplicate implementation left behind.

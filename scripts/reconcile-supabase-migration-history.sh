#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${EXPECTED_PROJECT_REF:?EXPECTED_PROJECT_REF is required}"

if [[ "${SUPABASE_DB_URL}" != *"${EXPECTED_PROJECT_REF}"* ]]; then
  echo "Refusing migration reconciliation: SUPABASE_DB_URL does not target ${EXPECTED_PROJECT_REF}." >&2
  exit 1
fi

psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -At -F '|' <<'SQL' > /tmp/zikr-supabase-preflight.txt
SELECT
  (SELECT count(*) FROM public.quran_ayahs),
  (SELECT count(DISTINCT (surah_id, ayah_number)) FROM public.quran_ayahs),
  (SELECT count(*) FROM public.quran_surahs),
  (SELECT count(*) FROM public.quran_tafsir),
  (SELECT count(*) FROM public.quran_tafsir WHERE tafsir_ar IS NULL OR length(trim(tafsir_ar)) = 0),
  (SELECT count(*) FROM public.hadiths),
  (SELECT count(*) FROM public.duas),
  (SELECT count(*) FROM public.stories),
  (SELECT count(*) FROM public.prophets),
  (SELECT count(*) FROM public.scholars),
  (SELECT count(*) FROM public.companions),
  (SELECT count(*) FROM public.articles),
  (SELECT count(*) FROM public.kids_games),
  (SELECT count(*) FROM public.article_categories),
  (SELECT count(*) FROM public.battles),
  (SELECT count(*) FROM public.battle_events),
  (SELECT count(*) FROM public.conquests),
  (SELECT count(*) FROM public.conquest_events),
  (SELECT count(*) FROM public.companion_stories),
  (SELECT count(*) FROM public.prophet_sections),
  (SELECT count(*) FROM public.hadith_books),
  (SELECT count(*) FROM public.quran_reciters),
  (SELECT count(*) FROM public.quran_audio),
  (SELECT count(*) FROM public.kids_game_levels),
  (SELECT count(*) FROM public.kids_content),
  (SELECT count(*) FROM public.video_categories),
  (SELECT count(*) FROM public.videos),
  (SELECT count(*) FROM public.media_assets),
  (SELECT count(*) FROM public.site_audio_assets),
  (SELECT count(*) FROM public.tawasheeh),
  (SELECT count(*) FROM public.tawasheeh_categories),
  (SELECT count(*) FROM public.content_library),
  (SELECT count(*) FROM public.content_agent_sources),
  (SELECT count(*) FROM public.site_settings),
  (SELECT count(*) FROM public.admin_settings WHERE key IN ('video_automation_enabled', 'video_automation_batch_size', 'video_automation_ai_enabled')),
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false),
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quran_tafsir' AND policyname = 'tmp_zikr_seed_loader'),
  (SELECT count(*) FROM pg_roles WHERE rolname = 'zikr_seed_loader' AND rolcanlogin);
SQL

IFS='|' read -r ayahs distinct_ayahs surahs tafsir empty_tafsir hadiths duas stories prophets scholars companions articles kids_games article_categories battles battle_events conquests conquest_events companion_stories prophet_sections hadith_books quran_reciters quran_audio kids_game_levels kids_content video_categories videos media_assets site_audio_assets tawasheeh tawasheeh_categories content_library content_agent_sources site_settings video_settings unprotected_tables temporary_policy seed_role_logins < /tmp/zikr-supabase-preflight.txt

assert_eq() {
  local actual="$1"
  local expected="$2"
  local label="$3"
  if [[ "$actual" != "$expected" ]]; then
    echo "PRECHECK FAILED: ${label}: expected ${expected}, got ${actual}" >&2
    exit 1
  fi
  echo "PASS: ${label} = ${actual}"
}

assert_positive() {
  local actual="$1"
  local label="$2"
  if [[ ! "$actual" =~ ^[0-9]+$ ]] || (( actual <= 0 )); then
    echo "PRECHECK FAILED: ${label} must be greater than zero; got ${actual}" >&2
    exit 1
  fi
  echo "PASS: ${label} = ${actual}"
}

assert_eq "$ayahs" "6236" "Quran ayah rows"
assert_eq "$distinct_ayahs" "6236" "distinct Quran ayahs"
assert_eq "$surahs" "114" "Quran surahs"
assert_eq "$tafsir" "6236" "tafsir rows"
assert_eq "$empty_tafsir" "0" "empty tafsir rows"
assert_eq "$video_settings" "3" "required video automation settings"
assert_eq "$unprotected_tables" "0" "public tables without RLS"
assert_eq "$temporary_policy" "0" "temporary seed-loader policies"
assert_eq "$seed_role_logins" "0" "temporary seed-loader roles with LOGIN"
assert_positive "$hadiths" "Hadith rows"
assert_positive "$duas" "Dua rows"
assert_positive "$stories" "Story rows"
assert_positive "$prophets" "Prophet rows"
assert_positive "$scholars" "Scholar rows"
assert_positive "$companions" "Companion rows"
assert_positive "$articles" "Article rows"
assert_positive "$kids_games" "Kids game rows"
assert_positive "$article_categories" "Article category rows"
assert_positive "$battles" "Battle rows"
assert_positive "$battle_events" "Battle event rows"
assert_positive "$conquests" "Conquest rows"
assert_positive "$conquest_events" "Conquest event rows"
assert_positive "$companion_stories" "Companion story rows"
assert_positive "$prophet_sections" "Prophet section rows"
assert_positive "$hadith_books" "Hadith book rows"
assert_positive "$quran_reciters" "Quran reciter rows"
assert_positive "$quran_audio" "Quran audio rows"
assert_positive "$kids_game_levels" "Kids game level rows"
assert_positive "$kids_content" "Kids content rows"
assert_positive "$video_categories" "Video category rows"
assert_positive "$videos" "Video catalog rows"
assert_positive "$media_assets" "Media asset rows"
assert_positive "$site_audio_assets" "Site audio asset rows"
assert_positive "$tawasheeh" "Tawasheeh rows"
assert_positive "$tawasheeh_categories" "Tawasheeh category rows"
assert_positive "$content_library" "Content library rows"
assert_positive "$content_agent_sources" "Content agent source rows"
assert_positive "$site_settings" "Site settings rows"

# Only reconcile migration metadata after schema parity is proven. This command
# does not execute migration SQL on production; it compares the live schema with
# a shadow database rebuilt from the repository migration chain.
diff_file="$(mktemp)"
trap 'rm -f "$diff_file" /tmp/zikr-supabase-preflight.txt' EXIT
# PGSSLMODE=require is intentionally scoped away from the Supabase CLI here:
# the CLI also starts a local shadow database that does not support TLS. The
# production endpoint requires TLS, and verify-supabase-db-url.py rejects any
# explicitly weakened sslmode in the supplied remote connection URL.
env -u PGSSLMODE supabase db diff \
  --db-url "$SUPABASE_DB_URL" \
  --schema public,private,storage,extensions \
  --use-pg-delta \
  --strict-coverage \
  --output "$diff_file"

non_comment_diff="$(grep -vE '^[[:space:]]*(--|$)' "$diff_file" || true)"
if [[ -n "${non_comment_diff//[[:space:]]/}" ]]; then
  echo "SCHEMA DRIFT DETECTED. Migration history will not be repaired and deployment must stop." >&2
  cat "$diff_file" >&2
  exit 1
fi
echo "PASS: live public/storage/extensions schema matches the replayed repository migration chain."

mapfile -t local_versions < <(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' |
    sed -E 's/^([0-9]{14})_.*/\1/' |
    sort -u
)
if [[ "${#local_versions[@]}" -eq 0 ]]; then
  echo "No versioned SQL migration files found." >&2
  exit 1
fi

remote_versions_text="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At -c 'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version')"
mapfile -t remote_versions <<< "$remote_versions_text"

declare -A local_set=()
declare -A remote_set=()
for version in "${local_versions[@]}"; do local_set["$version"]=1; done
for version in "${remote_versions[@]}"; do
  [[ "$version" =~ ^[0-9]{14}$ ]] || { echo "Unexpected remote migration version: $version" >&2; exit 1; }
  remote_set["$version"]=1
  if [[ -z "${local_set[$version]+x}" ]]; then
    echo "Remote migration version $version has no matching local SQL file; refusing automatic repair." >&2
    exit 1
  fi
done

missing_versions=()
for version in "${local_versions[@]}"; do
  if [[ -z "${remote_set[$version]+x}" ]]; then missing_versions+=("$version"); fi
done

echo "Local migration versions: ${#local_versions[@]}; remote recorded versions: ${#remote_versions[@]}; missing history entries: ${#missing_versions[@]}."
if [[ "${#missing_versions[@]}" -gt 0 ]]; then
  # All changes are history-only. Do not run db push and do not re-execute SQL.
  supabase migration repair --db-url "$SUPABASE_DB_URL" --status applied "${missing_versions[@]}"
fi

final_versions_text="$(psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -At -c 'SELECT version FROM supabase_migrations.schema_migrations ORDER BY version')"
mapfile -t final_versions <<< "$final_versions_text"
if [[ "${#final_versions[@]}" -ne "${#local_versions[@]}" ]]; then
  echo "Migration history reconciliation failed: expected ${#local_versions[@]} versions, found ${#final_versions[@]}." >&2
  exit 1
fi
for version in "${local_versions[@]}"; do
  if [[ -z "$(printf '%s\n' "${final_versions[@]}" | grep -Fx "$version" || true)" ]]; then
    echo "Migration version still missing after repair: $version" >&2
    exit 1
  fi
done
echo "SUPABASE_MIGRATION_HISTORY_RECONCILED: ${#final_versions[@]} versions recorded; schema and content preflight passed."

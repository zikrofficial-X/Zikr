#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${EXPECTED_PROJECT_REF:?EXPECTED_PROJECT_REF is required}"

python3 scripts/verify-supabase-db-url.py

migration_dir="supabase/migrations"
migration_files=(
  "20260817074038_quran_tafsir_expansion_01.sql"
  "20260817074103_quran_tafsir_expansion_02.sql"
  "20260817074131_quran_tafsir_expansion_03.sql"
  "20260817074153_quran_tafsir_expansion_04.sql"
  "20260817074216_quran_tafsir_expansion_05.sql"
  "20260817074237_quran_tafsir_expansion_06.sql"
  "20260817074304_quran_tafsir_expansion_07.sql"
  "20260817074324_quran_tafsir_expansion_08.sql"
  "20260817074342_quran_tafsir_expansion_09.sql"
)

for file in "${migration_files[@]}"; do
  if [[ ! -s "${migration_dir}/${file}" ]]; then
    echo "Missing source-verified Quran tafsir seed file: ${migration_dir}/${file}" >&2
    exit 1
  fi
done

read -r surahs ayahs distinct_ayahs current_rows current_distinct empty_rows invalid_metadata missing_pairs extra_pairs unique_index <<< "$(
  psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -At -F ' ' <<'SQL'
SELECT
  (SELECT count(*) FROM public.quran_surahs),
  (SELECT count(*) FROM public.quran_ayahs),
  (SELECT count(DISTINCT (surah_id, ayah_number)) FROM public.quran_ayahs),
  (SELECT count(*) FROM public.quran_tafsir WHERE author = 'التفسير الميسر'),
  (SELECT count(DISTINCT (surah_id, ayah_number)) FROM public.quran_tafsir WHERE author = 'التفسير الميسر'),
  (SELECT count(*) FROM public.quran_tafsir WHERE author = 'التفسير الميسر' AND (tafsir_ar IS NULL OR length(trim(tafsir_ar)) = 0)),
  (SELECT count(*) FROM public.quran_tafsir WHERE author = 'التفسير الميسر' AND (source_url IS DISTINCT FROM ('https://api.alquran.cloud/v1/surah/' || surah_id::text || '/ar.muyassar') OR retrieved_at IS NULL)),
  (SELECT count(*) FROM public.quran_ayahs a LEFT JOIN public.quran_tafsir t ON t.surah_id = a.surah_id AND t.ayah_number = a.ayah_number AND t.author = 'التفسير الميسر' WHERE t.id IS NULL),
  (SELECT count(*) FROM public.quran_tafsir t LEFT JOIN public.quran_ayahs a ON a.surah_id = t.surah_id AND a.ayah_number = t.ayah_number WHERE t.author = 'التفسير الميسر' AND a.id IS NULL),
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quran_tafsir' AND indexdef ILIKE 'CREATE UNIQUE INDEX% (surah_id, ayah_number, author)%');
SQL
)"

[[ "${surahs}" == "114" ]] || { echo "Expected 114 Quran surahs; found ${surahs}." >&2; exit 1; }
[[ "${ayahs}" == "6236" && "${distinct_ayahs}" == "6236" ]] || {
  echo "Canonical Quran ayah corpus is incomplete or duplicated: rows=${ayahs}, unique=${distinct_ayahs}." >&2
  exit 1
}
[[ "${unique_index}" -ge 1 ]] || {
  echo "Required unique quran_tafsir(surah_id, ayah_number, author) index is missing; refusing restore." >&2
  exit 1
}
if (( current_rows > 6236 )); then
  echo "Unexpected ${current_rows} التفسير الميسر rows already exist; refusing to overwrite an unrecognized corpus." >&2
  exit 1
fi

if [[ "${current_rows}" == "6236" &&
      "${current_distinct}" == "6236" &&
      "${empty_rows}" == "0" &&
      "${invalid_metadata}" == "0" &&
      "${missing_pairs}" == "0" &&
      "${extra_pairs}" == "0" ]]; then
  echo "PASS: the complete source-verified التفسير الميسر corpus is already present; no writes are needed."
  exit 0
fi

echo "Restoring the original nine idempotent التفسير الميسر source chunks in one PostgreSQL transaction."
psql_args=(-v ON_ERROR_STOP=1 --single-transaction)
for file in "${migration_files[@]}"; do
  psql_args+=(-f "${migration_dir}/${file}")
done
psql "${SUPABASE_DB_URL}" "${psql_args[@]}"

read -r restored_rows restored_distinct restored_empty restored_invalid restored_missing restored_extra <<< "$(
  psql "${SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -At -F ' ' <<'SQL'
SELECT
  (SELECT count(*) FROM public.quran_tafsir WHERE author = 'التفسير الميسر'),
  (SELECT count(DISTINCT (surah_id, ayah_number)) FROM public.quran_tafsir WHERE author = 'التفسير الميسر'),
  (SELECT count(*) FROM public.quran_tafsir WHERE author = 'التفسير الميسر' AND (tafsir_ar IS NULL OR length(trim(tafsir_ar)) = 0)),
  (SELECT count(*) FROM public.quran_tafsir WHERE author = 'التفسير الميسر' AND (source_url IS DISTINCT FROM ('https://api.alquran.cloud/v1/surah/' || surah_id::text || '/ar.muyassar') OR retrieved_at IS NULL)),
  (SELECT count(*) FROM public.quran_ayahs a LEFT JOIN public.quran_tafsir t ON t.surah_id = a.surah_id AND t.ayah_number = a.ayah_number AND t.author = 'التفسير الميسر' WHERE t.id IS NULL),
  (SELECT count(*) FROM public.quran_tafsir t LEFT JOIN public.quran_ayahs a ON a.surah_id = t.surah_id AND a.ayah_number = t.ayah_number WHERE t.author = 'التفسير الميسر' AND a.id IS NULL);
SQL
)"

[[ "${restored_rows}" == "6236" && "${restored_distinct}" == "6236" &&
   "${restored_empty}" == "0" && "${restored_invalid}" == "0" &&
   "${restored_missing}" == "0" && "${restored_extra}" == "0" ]] || {
  echo "Quran tafsir restore verification failed: rows=${restored_rows}, unique=${restored_distinct}, empty=${restored_empty}, invalid_metadata=${restored_invalid}, missing_ayahs=${restored_missing}, extra_ayahs=${restored_extra}." >&2
  exit 1
}

echo "QURAN_TAFSIR_RESTORED: 6236 source-verified, unique, non-empty ayah records for all 114 surahs."

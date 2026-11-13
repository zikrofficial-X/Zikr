#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTAINER_NAME="zikr-client-table-privilege-hardening-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=zikr_client_privilege_hardening_test \
  --volume "$ROOT_DIR:/workspace:ro" \
  postgres:17 >/dev/null

ready=0
for attempt in $(seq 1 40); do
  if docker exec "$CONTAINER_NAME" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d zikr_client_privilege_hardening_test -c "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  docker logs "$CONTAINER_NAME"
  echo "PostgreSQL client table privilege test container did not become ready." >&2
  exit 1
fi

psql=(docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -U postgres -d zikr_client_privilege_hardening_test)
"${psql[@]}" -f /workspace/scripts/tests/client-table-privilege-hardening.integration-setup.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261111000000_revoke_anon_public_admin_predicate.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261112103200_revoke_client_non_dml_table_privileges.sql
"${psql[@]}" -f /workspace/scripts/tests/client-table-privilege-hardening.integration.sql

echo "Client table non-DML privilege hardening integration passed."

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTAINER_NAME="zikr-admin-role-test-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=zikr_admin_test \
  --volume "$ROOT_DIR:/workspace:ro" \
  postgres:17 >/dev/null

ready=0
for attempt in $(seq 1 40); do
  if docker exec "$CONTAINER_NAME" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d zikr_admin_test -c "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  docker logs "$CONTAINER_NAME"
  echo "PostgreSQL admin-role test container did not become ready." >&2
  exit 1
fi

psql=(docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -U postgres -d zikr_admin_test)
"${psql[@]}" -f /workspace/scripts/tests/admin-role-update.integration-setup.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261101170000_admin_atomic_role_update.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261101190000_admin_atomic_site_audio_primary.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261111020000_admin_role_update_blocks_self_demotion.sql
"${psql[@]}" -f /workspace/scripts/tests/admin-role-update.integration.sql

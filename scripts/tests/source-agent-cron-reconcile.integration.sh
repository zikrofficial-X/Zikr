#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTAINER_NAME="zikr-source-agent-cron-reconcile-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=zikr_source_agent_cron_reconcile_test \
  --volume "$ROOT_DIR:/workspace:ro" \
  postgres:17 >/dev/null

ready=0
for attempt in $(seq 1 40); do
  if docker exec "$CONTAINER_NAME" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d zikr_source_agent_cron_reconcile_test -c "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  docker logs "$CONTAINER_NAME"
  echo "PostgreSQL source-agent cron reconciliation test container did not become ready." >&2
  exit 1
fi

psql=(docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -U postgres -d zikr_source_agent_cron_reconcile_test)
"${psql[@]}" -f /workspace/scripts/tests/source-agent-cron-reconcile.integration-setup.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261113210000_reconcile_source_agent_cron_project_ref.sql
"${psql[@]}" -f /workspace/scripts/tests/source-agent-cron-reconcile.integration.sql

# A duplicate job name must be removed and recreated as one canonical job.
"${psql[@]}" -c "INSERT INTO cron.job (jobname, schedule, command, active) VALUES
  ('zikr-source-verified-content-agent', '0 4 * * *', 'SELECT 1', true),
  ('zikr-source-verified-content-agent', '0 5 * * *', 'SELECT 2', false);"
"${psql[@]}" -f /workspace/supabase/migrations/20261113210000_reconcile_source_agent_cron_project_ref.sql
"${psql[@]}" -f /workspace/scripts/tests/source-agent-cron-reconcile.integration.sql

echo "Source-agent cron reconciliation integration passed."

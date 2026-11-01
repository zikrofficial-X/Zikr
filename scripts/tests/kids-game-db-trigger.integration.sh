#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTAINER_NAME="zikr-kids-trigger-test-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=zikr_kids_test \
  --health-cmd="pg_isready -U postgres -d zikr_kids_test" \
  --health-interval=2s \
  --health-timeout=3s \
  --health-retries=30 \
  --health-start-period=5s \
  --volume "$ROOT_DIR:/workspace:ro" \
  postgres:17 >/dev/null

# pg_isready may briefly report a listener while initdb is handing off to the
# final postmaster. Wait for both the container health check and a real SQL
# round-trip, then require a second successful round-trip after a short pause.
ready=0
for attempt in $(seq 1 60); do
  state="$(docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || true)"
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER_NAME" 2>/dev/null || true)"
  if [[ "$state" != "running" ]]; then
    break
  fi
  if [[ "$health" == "healthy" ]] &&
    docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -At -U postgres -d zikr_kids_test -c "SELECT 1" >/dev/null 2>&1; then
    sleep 2
    if docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null | grep -qx "running" &&
      docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -At -U postgres -d zikr_kids_test -c "SELECT 1" >/dev/null 2>&1; then
      ready=1
      break
    fi
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  docker inspect "$CONTAINER_NAME" || true
  docker logs "$CONTAINER_NAME" || true
  echo "PostgreSQL test container did not remain ready for SQL queries." >&2
  exit 1
fi

psql=(docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -U postgres -d zikr_kids_test)
"${psql[@]}" -f /workspace/scripts/tests/kids-game-db-trigger.integration-setup.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261101090000_harden_kids_game_result_insert_contract.sql
"${psql[@]}" -f /workspace/scripts/tests/kids-game-db-trigger.integration.sql

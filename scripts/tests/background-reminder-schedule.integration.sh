#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTAINER_NAME="zikr-background-reminder-test-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=zikr_background_reminder_test \
  --volume "$ROOT_DIR:/workspace:ro" \
  postgres:17 >/dev/null

ready=0
for attempt in $(seq 1 40); do
  if docker exec "$CONTAINER_NAME" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d zikr_background_reminder_test -c "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  docker logs "$CONTAINER_NAME"
  echo "PostgreSQL background-reminder test container did not become ready." >&2
  exit 1
fi

psql=(docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -U postgres -d zikr_background_reminder_test)
"${psql[@]}" -f /workspace/scripts/tests/background-reminder-schedule.integration-setup.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261111010000_background_reminders_respect_quiet_hours_timezone.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261113000000_background_reminder_intervals_allow_disabled.sql
"${psql[@]}" -f /workspace/scripts/tests/background-reminder-schedule.integration.sql

echo "Background reminder interval and quiet-hours PostgreSQL integration passed."

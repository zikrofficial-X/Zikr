#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTAINER_NAME="zikr-kids-game-levels-rls-test-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=zikr_kids_game_levels_test \
  --volume "$ROOT_DIR:/workspace:ro" \
  postgres:17 >/dev/null

ready=0
for attempt in $(seq 1 40); do
  if docker exec "$CONTAINER_NAME" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d zikr_kids_game_levels_test -c "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  docker logs "$CONTAINER_NAME"
  echo "PostgreSQL Kids game-level RLS test container did not become ready." >&2
  exit 1
fi

psql=(docker exec "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -U postgres -d zikr_kids_game_levels_test)
"${psql[@]}" -f /workspace/scripts/tests/kids-game-levels-rls.integration-setup.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261111040000_kids_game_levels_require_published_game.sql
"${psql[@]}" -f /workspace/supabase/migrations/20261111170000_kids_game_questions_require_published_parent.sql
"${psql[@]}" -f /workspace/scripts/tests/kids-game-levels-rls.integration.sql

echo "Kids game and question publication RLS integration passed."

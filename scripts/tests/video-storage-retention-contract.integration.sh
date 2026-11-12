#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTAINER_NAME="zikr-video-storage-retention-test-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach \
  --name "$CONTAINER_NAME" \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=zikr_video_retention_test \
  --volume "$ROOT_DIR:/workspace:ro" \
  postgres:17 >/dev/null

ready=0
for attempt in $(seq 1 40); do
  if docker exec "$CONTAINER_NAME" psql -X -q -v ON_ERROR_STOP=1 -U postgres -d zikr_video_retention_test -c "SELECT 1" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" != "1" ]]; then
  docker logs "$CONTAINER_NAME"
  echo "PostgreSQL video Storage-retention test container did not become ready." >&2
  exit 1
fi

psql=(docker exec -i "$CONTAINER_NAME" psql -X -v ON_ERROR_STOP=1 -U postgres -d zikr_video_retention_test)
"${psql[@]}" <<'SQL'
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE TABLE public.social_publish_queue (
  id uuid PRIMARY KEY,
  content_id text NOT NULL,
  status text NOT NULL,
  video_url text,
  metadata jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.video_generation_requests (
  id uuid PRIMARY KEY,
  status text NOT NULL,
  video_url text,
  content jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
SQL

"${psql[@]}" -f /workspace/supabase/migrations/20261111153000_harden_video_storage_retention_rpc.sql
"${psql[@]}" -f /workspace/scripts/tests/video-storage-retention-contract.integration.sql

echo "Video Storage-retention RPC contract integration passed."

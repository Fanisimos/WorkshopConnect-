#!/usr/bin/env bash
# ---------------------------------------------------------------------
# Database permission tests against a throwaway local Postgres.
#   1. starts a temporary Postgres cluster (needs Postgres 15+ binaries)
#   2. loads a minimal Supabase stand-in (roles, auth.users, auth.uid())
#   3. applies every migration in supabase/migrations
#   4. runs tests/db/*.test.sql and reports ok / not ok
# No Supabase project, keys or Docker required. Nothing is persisted.
# ---------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${TEST_DB_PORT:-54329}"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/wc-testdb.XXXXXX")"

cleanup() {
  pg_ctl -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TMP"
}
trap cleanup EXIT

command -v initdb >/dev/null || { echo "initdb not found: install PostgreSQL (e.g. brew install postgresql@16)"; exit 1; }

initdb -D "$TMP/data" -U postgres --auth=trust -E UTF8 >/dev/null
# TCP only: avoids macOS's 103-byte unix-socket path limit
pg_ctl -D "$TMP/data" -l "$TMP/log.txt" -w \
  -o "-p $PORT -k '' -c listen_addresses=127.0.0.1" start >/dev/null

export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres
PSQL=(psql -qX -v ON_ERROR_STOP=1 -o /dev/null)

"${PSQL[@]}" -f "$ROOT/tests/db/supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate  $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

status=0
for t in "$ROOT"/tests/db/*.test.sql; do
  echo "test     $(basename "$t")"
  # pipefail makes this fail if psql fails (first "not ok" aborts the file)
  if ! "${PSQL[@]}" -f "$t" 2>&1 | sed -E 's/^psql:[^ ]+ (NOTICE|ERROR):  /\1 /; s/^NOTICE /  /; s/^ERROR /  /'; then
    status=1
  fi
done

if [[ $status -ne 0 ]]; then
  echo "DATABASE TESTS FAILED"; exit 1
fi
echo "DATABASE TESTS PASSED"

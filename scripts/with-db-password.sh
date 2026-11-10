#!/usr/bin/env bash
# ---------------------------------------------------------------------
# Run a Supabase CLI command against the linked project, prompting for
# the database password (input hidden). The password lives only in this
# script's process: not echoed, not in shell history, not saved to disk.
# (Without it, CLI v2.84 hangs at "Initialising login role...".)
#
#   npm run db:push    -> supabase db push
#   npm run db:types   -> regenerate src/lib/database.types.ts
# ---------------------------------------------------------------------
set -euo pipefail

printf "Supabase database password (typing is hidden, press Enter when done): "
IFS= read -rs SUPABASE_DB_PASSWORD
echo
export SUPABASE_DB_PASSWORD

case "${1:-}" in
  push)
    supabase db push
    ;;
  types)
    tmp="$(mktemp)"
    supabase gen types typescript --linked --schema public > "$tmp"
    mv "$tmp" src/lib/database.types.ts
    echo "Wrote src/lib/database.types.ts"
    ;;
  *)
    echo "usage: $0 push|types" >&2; exit 2
    ;;
esac

#!/usr/bin/env bash
# ============================================================================
# One-shot migrate + seed. Runs the project's migrations in order, then the
# base + demo seeds, against the freshly-started Postgres. Idempotent: a marker
# table (_docker_seed_done) makes re-runs a no-op, so `docker compose up` is
# safe to run repeatedly without duplicating seeded rows.
#
# Ordering: this service waits (via compose depends_on) for db + auth + storage
# to be healthy first, so auth.users and the storage schema exist before the
# migrations (which reference them) and the seed (which inserts auth users) run.
# ============================================================================
set -euo pipefail

PSQL="psql -v ON_ERROR_STOP=1 -X -q"

if [ "$($PSQL -tAc "select to_regclass('public._docker_seed_done') is not null")" = "t" ]; then
	echo "[migrate] already applied (marker present) — skipping."
	exit 0
fi

shopt -s nullglob
migrations=(/supabase/migrations/*.sql)
echo "[migrate] applying ${#migrations[@]} migrations…"
for f in "${migrations[@]}"; do
	echo "  -> $(basename "$f")"
	$PSQL -f "$f"
done

echo "[migrate] seeding base (seed.sql) + demo (demo.sql)…"
$PSQL -f /supabase/seed.sql
$PSQL -f /supabase/seed-data/demo.sql

$PSQL -c "create table if not exists public._docker_seed_done (applied_at timestamptz default now())"
$PSQL -c "insert into public._docker_seed_done default values"
echo "[migrate] complete."

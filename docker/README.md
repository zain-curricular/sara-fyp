# Self-contained Docker stack

One command brings up the **entire app** — local Supabase (Postgres, Auth, REST,
Realtime, Storage, Studio, API gateway) **and** the Next.js server — with the
database migrated, seeded, and its demo images loaded.

This is **additive**: it does not replace or touch the `supabase` CLI workflow.
Use whichever you prefer.

## Quick start

```bash
# from the repo root
npm run docker:up          # foreground (Ctrl-C to stop)
# or
npm run docker:up:d        # detached
```

First run builds the app image and pulls nothing new (Supabase images are the
exact versions the CLI already uses). Give it a few minutes. Then:

| Service | URL |
|---|---|
| **App** | http://localhost:3202 |
| Supabase API gateway | http://localhost:56321 |
| Supabase Studio (DB UI) | http://localhost:56323 |
| Postgres (psql/tools) | `postgresql://postgres:postgres@localhost:56322/postgres` |

Logins (all demo accounts): `seller1@demo.shopsmart.pk` / `Seller@123`,
`buyer1@demo.shopsmart.pk` / `Buyer@123`, `admin@shopsmart.pk` / `Admin@123`,
`mech1@demo.shopsmart.pk` / `Mech@123`.

## Commands

```bash
npm run docker:up        # start everything (foreground)
npm run docker:up:d      # start everything (detached)
npm run docker:down      # stop (keeps data)
npm run docker:reset     # stop AND wipe volumes → next up re-seeds from scratch
npm run docker:logs      # tail all logs
npm run docker:build     # rebuild the app image after code changes
```

## Ports & collision-safety

Every published port lives in [`.env`](.env) in a **56xxx** range, chosen so this
stack never collides with the other local Supabase project (55xxx) or a default
CLI stack (543xx). **If a port is already taken, change it in `.env` only** —
nothing else needs editing and no other project is disturbed.

## How it works

```mermaid
flowchart LR
  browser[Browser :3202] --> app[Next.js app]
  browser -->|:56321| kong[API gateway]
  app -->|kong:8000 internal| kong
  kong --> auth & rest & realtime & storage
  auth & rest & realtime & storage --> db[(Postgres)]
  migrate[[migrate: migrations + seed]] --> db
  seedimg[[seed-images: upload pool]] --> storage
```

- **`db`** — `supabase/postgres`. On first init it sets service-role passwords
  ([`volumes/db/roles.sql`](volumes/db/roles.sql)) and hands the auth/storage
  schemas to their admin roles ([`volumes/db/fix-ownership.sql`](volumes/db/fix-ownership.sql)),
  which the plain base image otherwise leaves owned by `postgres` (breaking GoTrue).
- **`migrate`** (one-shot) — applies `supabase/migrations/*.sql` in order, then
  `seed.sql` + `seed-data/demo.sql`. Idempotent via a `_docker_seed_done` marker,
  so re-running `up` never double-seeds.
- **`seed-images`** (one-shot) — uploads the committed image pool into Storage and
  rewrites the DB URLs to the browser-reachable published port.
- **`app`** — `next dev`. Server code reaches Supabase over the internal network
  (`SUPABASE_INTERNAL_URL=http://kong:8000`); the browser uses the published
  `NEXT_PUBLIC_SUPABASE_URL=http://localhost:56321`.

Images are pinned to the versions the Supabase CLI uses for this project (Kong
2.8.1 gateway), so they are already on the machine and known-compatible with the
migrations.

## Notes

- **OpenAI** is optional. Set `OPENAI_API_KEY` in `.env` to enable AI search /
  chatbot embeddings; without it the app still runs and images still seed.
- **Fresh reseed**: `npm run docker:reset` wipes the DB + storage volumes; the
  next `up` re-runs migrations, seed, and image upload from scratch.
- The keys in `.env` are the standard **local demo** keys (same as the CLI) —
  local-only, not secrets.

# Seed image pool

A committed pool of **40 automotive photos** (`part-01.jpg` … `part-40.jpg`) used
to make the demo fully **offline** — no internet needed at demo time.

## How they're used

`npm run seed:images` (→ `supabase/scripts/upload-images.mjs`) uploads this pool
into the local Supabase Storage bucket **`listing-images`** and rewrites every
`listing_images.url` / `seller_stores.logo_url` to the resulting public Storage
URLs. Run it after `supabase db reset` (which reseeds the original CDN URLs).

The step is idempotent: uploads use upsert and the pool is assigned to listings
deterministically, so re-running produces the same result.

## Provenance

Images were fetched once from **loremflickr.com** (Creative-Commons Flickr
photos) across automotive tags (engine, brake, tire, headlight, battery,
exhaust, radiator, suspension, bumper, mirror, dashboard, interior). `manifest.json`
records the source tag per file. They are placeholder demo assets only.

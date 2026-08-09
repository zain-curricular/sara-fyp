// ============================================================================
// Image Backfill — upload the committed pool to Supabase Storage
// ============================================================================
//
// Makes the demo fully OFFLINE: uploads the committed image pool
// (supabase/seed-data/images/part-*.jpg) into the public `listing-images`
// Storage bucket, then rewrites every `listing_images.url` and
// `seller_stores.logo_url` to the resulting local public Storage URLs.
//
// Why a script (not the SQL seed)
// -------------------------------
// The SQL seed can't talk to the Storage API, and it keeps its loremflickr CDN
// URLs so a bare `supabase db reset` still works online. This script is the
// out-of-band step that flips the demo to local Storage. It is idempotent:
// uploads use upsert, and pool images are assigned to listings deterministically
// (by a hash of listing_id + image position), so re-running is a no-op-equivalent.
//
// Usage
// -----
//   node supabase/scripts/upload-images.mjs   |   npm run seed:images
//
// Requires (already in .env): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;

// ----------------------------------------------------------------------------
// Env + clients
// ----------------------------------------------------------------------------

loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET = "listing-images";
const PREFIX = "pool";
const BATCH = 200;

if (!SUPABASE_URL || !SERVICE_ROLE) {
	console.error("[images] Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — aborting.");
	process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
	auth: { persistSession: false, autoRefreshToken: false },
});

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(scriptDir, "../seed-data/images");

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Stable small hash of a string → non-negative int (for deterministic assignment). */
function hash(str) {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

/** Public URL for a pool object. */
function publicUrl(file) {
	return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${PREFIX}/${file}`;
}

// ----------------------------------------------------------------------------
// 1) Upload the pool
// ----------------------------------------------------------------------------

async function uploadPool() {
	const files = readdirSync(IMAGES_DIR)
		.filter((f) => /^part-\d+\.jpg$/i.test(f))
		.sort();

	if (files.length === 0) {
		console.error(`[images] No pool images found in ${IMAGES_DIR} — aborting.`);
		process.exit(1);
	}

	// Ensure the bucket exists (belt-and-suspenders with the migration).
	await admin.storage.createBucket(BUCKET, { public: true }).catch(() => null);

	console.log(`[images] uploading ${files.length} pool images to ${BUCKET}/${PREFIX}/…`);

	for (const file of files) {
		const bytes = readFileSync(path.join(IMAGES_DIR, file));
		const { error } = await admin.storage
			.from(BUCKET)
			.upload(`${PREFIX}/${file}`, bytes, {
				upsert: true,
				contentType: "image/jpeg",
				cacheControl: "3600",
			});

		if (error) {
			console.error(`[images] upload failed for ${file}:`, error.message);
			process.exit(1);
		}
	}

	console.log(`[images] pool uploaded (${files.length} objects).`);
	return files;
}

// ----------------------------------------------------------------------------
// 2) Rewrite listing_images → Storage URLs
// ----------------------------------------------------------------------------

async function rewriteListingImages(pool) {
	// Page through all rows — PostgREST caps a single response at 1000.
	const rows = [];
	for (let from = 0; ; from += 1000) {
		const { data, error } = await admin
			.from("listing_images")
			.select("id, listing_id, position")
			.order("id", { ascending: true })
			.range(from, from + 999);
		if (error) throw new Error(`fetch listing_images: ${error.message}`);
		rows.push(...(data ?? []));
		if (!data || data.length < 1000) break;
	}

	if (rows.length === 0) {
		console.log("[images] no listing_images rows — skipping.");
		return 0;
	}

	// Deterministic assignment: a listing's images cycle through the pool from a
	// per-listing base, so a listing's photos differ and neighbours vary.
	const items = rows.map((r) => {
		const base = hash(r.listing_id);
		const idx = (base + (r.position ?? 0)) % pool.length;
		const file = pool[idx];
		return { id: r.id, url: publicUrl(file), storage_path: `${PREFIX}/${file}` };
	});

	let done = 0;
	for (let i = 0; i < items.length; i += BATCH) {
		const slice = items.slice(i, i + BATCH);
		const { data, error: rpcErr } = await admin.rpc("set_listing_image_urls", { items: slice });
		if (rpcErr) throw new Error(`set_listing_image_urls @${i}: ${rpcErr.message}`);
		done += Number(data ?? slice.length);
		console.log(`[images] listing_images: ${Math.min(i + BATCH, items.length)}/${items.length} rewritten`);
	}

	return done;
}

// ----------------------------------------------------------------------------
// 3) Rewrite store logos → Storage URLs
// ----------------------------------------------------------------------------

async function rewriteStoreLogos(pool) {
	const { data: stores, error } = await admin
		.from("seller_stores")
		.select("id")
		.not("logo_url", "is", null)
		.limit(5000);

	if (error) throw new Error(`fetch seller_stores: ${error.message}`);
	if (!stores || stores.length === 0) return 0;

	let done = 0;
	for (const s of stores) {
		const file = pool[hash(s.id) % pool.length];
		const { error: upErr } = await admin
			.from("seller_stores")
			.update({ logo_url: publicUrl(file) })
			.eq("id", s.id);
		if (!upErr) done += 1;
	}

	console.log(`[images] store logos: ${done}/${stores.length} rewritten`);
	return done;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
	console.log(`[images] url=${SUPABASE_URL} dir=${IMAGES_DIR}`);
	const pool = await uploadPool();
	const listings = await rewriteListingImages(pool);
	const logos = await rewriteStoreLogos(pool);
	console.log(`[images] complete — listing_images:${listings} logos:${logos}`);
}

main().catch((err) => {
	console.error("[images] fatal:", err);
	process.exit(1);
});

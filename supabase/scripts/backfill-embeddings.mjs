// ============================================================================
// Embeddings Backfill — ShopSmart
// ============================================================================
//
// Computes OpenAI embeddings for every listing and knowledge-base document that
// does not have one yet, and writes them into the pgvector `embedding` columns
// so the semantic search / recommendation / chatbot-RAG paths light up.
//
// Why a script (not the SQL seed)
// -------------------------------
// `supabase db reset` seeds pure SQL, which cannot call OpenAI — so seeded rows
// always start with `embedding IS NULL` and the app degrades to its keyword/SQL
// fallbacks. This script is the out-of-band step that fills them in. It is
// idempotent: it only touches rows where the embedding is still NULL, so it is
// safe to re-run after every reset.
//
// Pipeline
// --------
//   fetch NULL-embedding rows  ->  compose one text per row  ->  embedDocuments
//   (batched)  ->  push numeric batch via set_listing_embeddings / set_kb_embeddings
//
// Usage
// -----
//   node supabase/scripts/backfill-embeddings.mjs
//   npm run seed:embeddings
//
// Requires (already in .env): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// OPENAI_API_KEY. Without OPENAI_API_KEY the script exits 0 as a no-op (the app
// still works on fallbacks).

import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;

// ----------------------------------------------------------------------------
// Env + clients
// ----------------------------------------------------------------------------

loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

// Batch size for both the OpenAI request and the DB write round-trip.
const BATCH = 100;

if (!SUPABASE_URL || !SERVICE_ROLE) {
	console.error("[backfill] Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — aborting.");
	process.exit(1);
}

if (!OPENAI_KEY) {
	console.log("[backfill] OPENAI_API_KEY not set — nothing to do (app runs on fallbacks). Exiting 0.");
	process.exit(0);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
	auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Embed a batch of strings via the OpenAI REST API directly (no SDK — the
 * LangChain client can't resolve @langchain/core outside Next's bundler).
 * Returns embeddings in the same order as the inputs.
 */
async function embedDocuments(texts) {
	const res = await fetch("https://api.openai.com/v1/embeddings", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OPENAI_KEY}`,
		},
		body: JSON.stringify({ model: MODEL, input: texts, encoding_format: "float" }),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`OpenAI embeddings ${res.status}: ${body.slice(0, 300)}`);
	}

	const json = await res.json();
	// Sort by index to guarantee input↔output alignment, then take the vectors.
	return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

// ----------------------------------------------------------------------------
// Text composition — what each row "means" for retrieval
// ----------------------------------------------------------------------------

/** Flatten a listing's salient fields into one embedding input string. */
function listingText(row) {
	const category = row.categories?.name ? `Category: ${row.categories.name}.` : "";
	const condition = row.condition ? `Condition: ${row.condition}.` : "";

	// Pull a few high-signal detail keys (make/model/year/brand/part number) if present.
	const d = row.details ?? {};
	const detailBits = ["make", "model", "year", "brand", "part_number", "oem", "fitment"]
		.map((k) => (d[k] != null ? `${k}: ${d[k]}` : null))
		.filter(Boolean)
		.join(". ");

	return [row.title, category, condition, detailBits, row.description ?? ""]
		.filter(Boolean)
		.join(". ")
		.slice(0, 4000);
}

/** KB documents embed on title + content. */
function kbText(row) {
	return [row.title, row.content ?? ""].filter(Boolean).join(". ").slice(0, 6000);
}

// ----------------------------------------------------------------------------
// Backfill one table
// ----------------------------------------------------------------------------

async function backfill({ label, fetchRows, toText, rpc }) {
	const rows = await fetchRows();

	if (rows.length === 0) {
		console.log(`[backfill] ${label}: 0 rows need embeddings — skipping.`);
		return 0;
	}

	console.log(`[backfill] ${label}: ${rows.length} rows to embed (batch ${BATCH})…`);

	let done = 0;

	for (let i = 0; i < rows.length; i += BATCH) {
		const slice = rows.slice(i, i + BATCH);
		const vectors = await embedDocuments(slice.map(toText));

		const items = slice.map((r, idx) => ({ id: r.id, values: vectors[idx] }));
		const { data, error } = await admin.rpc(rpc, { items });

		if (error) {
			console.error(`[backfill] ${label}: RPC ${rpc} failed at offset ${i}:`, error.message);
			process.exit(1);
		}

		done += Number(data ?? slice.length);
		console.log(`[backfill] ${label}: ${Math.min(i + BATCH, rows.length)}/${rows.length} written`);
	}

	console.log(`[backfill] ${label}: done — ${done} rows updated.`);
	return done;
}

// ----------------------------------------------------------------------------
// Row fetchers (NULL-embedding only → idempotent)
// ----------------------------------------------------------------------------

async function fetchListings() {
	const { data, error } = await admin
		.from("listings")
		.select("id, title, condition, description, details, categories(name)")
		.is("embedding", null)
		.limit(5000);

	if (error) throw new Error(`fetch listings: ${error.message}`);
	return data ?? [];
}

async function fetchKb() {
	const { data, error } = await admin
		.from("kb_documents")
		.select("id, title, content")
		.is("embedding", null)
		.limit(5000);

	if (error) throw new Error(`fetch kb_documents: ${error.message}`);
	return data ?? [];
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
	console.log(`[backfill] model=${MODEL} url=${SUPABASE_URL}`);

	const listings = await backfill({
		label: "listings",
		fetchRows: fetchListings,
		toText: listingText,
		rpc: "set_listing_embeddings",
	});

	const kb = await backfill({
		label: "kb_documents",
		fetchRows: fetchKb,
		toText: kbText,
		rpc: "set_kb_embeddings",
	});

	console.log(`[backfill] complete — listings:${listings} kb:${kb}`);
}

main().catch((err) => {
	console.error("[backfill] fatal:", err);
	process.exit(1);
});

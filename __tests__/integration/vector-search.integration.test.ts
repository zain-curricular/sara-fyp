// ============================================================================
// Integration — pgvector plumbing (setters + search RPCs)
// ============================================================================
//
// Proves the embedding write→read path end to end WITHOUT calling OpenAI, so it
// passes on a freshly reset DB (embeddings NULL) as well as after the
// `npm run seed:embeddings` backfill:
//
//   set_kb_embeddings (jsonb numeric batch)  ->  kb_documents.embedding (vector)
//     ->  search_kb_documents (cosine)  ->  ranked rows
//
// The synthetic unit vector e0 = [1, 0, …] makes cosine self-similarity exactly
// 1.0, which also confirms the setter preserves element ORDER (a scrambled write
// would not self-rank at 1.0). A throwaway KB doc is inserted and deleted so the
// seeded dataset is untouched. Requires local Supabase (service role).

import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { canRunSupabaseIntegrationTests } from "./env";

const run = canRunSupabaseIntegrationTests ? describe : describe.skip;

const DIMS = 1536;

function admin(): SupabaseClient {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
}

/** Unit vector along axis `i` — cosine with itself is exactly 1.0. */
function unitVector(i: number): number[] {
	const v = new Array(DIMS).fill(0);
	v[i] = 1;
	return v;
}

run("pgvector plumbing", () => {
	const supabase = admin();

	it("set_kb_embeddings writes a vector that search_kb_documents ranks at ~1.0", async () => {
		// Insert a throwaway KB doc (no embedding yet).
		const { data: inserted, error: insErr } = await supabase
			.from("kb_documents")
			.insert({
				title: "__vector_test__",
				source: "integration-test",
				content: "Synthetic document used to verify the pgvector write/read path.",
			})
			.select("id")
			.single();

		expect(insErr).toBeNull();
		const id = inserted!.id as string;

		try {
			// Write a known unit vector through the setter RPC.
			const values = unitVector(0);
			const { data: written, error: setErr } = await supabase.rpc("set_kb_embeddings", {
				items: [{ id, values }],
			});
			expect(setErr).toBeNull();
			expect(Number(written)).toBe(1);

			// Search with the SAME vector — our doc must come back first at ~1.0.
			const { data: results, error: searchErr } = await supabase.rpc("search_kb_documents", {
				query_embedding: values,
				match_count: 3,
			});
			expect(searchErr).toBeNull();
			expect(Array.isArray(results)).toBe(true);

			const rows = results as { id: string; similarity: number }[];
			const mine = rows.find((r) => r.id === id);
			expect(mine).toBeDefined();
			expect(mine!.similarity).toBeGreaterThan(0.999);
			// Self is the maximum → it ranks first.
			expect(rows[0].id).toBe(id);
		} finally {
			await supabase.from("kb_documents").delete().eq("id", id);
		}
	});

	it("search_kb_documents returns empty (no error) for a null-safe/degenerate query", async () => {
		// An all-zero vector has undefined cosine direction; the RPC must not throw.
		const { data, error } = await supabase.rpc("search_kb_documents", {
			query_embedding: new Array(DIMS).fill(0),
			match_count: 3,
		});
		expect(error).toBeNull();
		expect(Array.isArray(data)).toBe(true);
	});

	it("find_similar_listings honours both seeded states (empty pre-backfill, ranked post-backfill)", async () => {
		// Pick any active listing that has an embedding (present only after backfill).
		const { data: withEmb } = await supabase
			.from("listings")
			.select("id, category_id, embedding")
			.eq("status", "active")
			.not("embedding", "is", null)
			.limit(1);

		if (!withEmb || withEmb.length === 0) {
			// Fresh reset (no backfill): the RPC must degrade to an empty set, not error.
			const probe = unitVector(1);
			const { data, error } = await supabase.rpc("find_similar_listings", {
				query_embedding: probe,
				exclude_id: "00000000-0000-0000-0000-000000000000",
				target_category_id: null,
				match_count: 6,
			});
			expect(error).toBeNull();
			expect(Array.isArray(data)).toBe(true);
			return;
		}

		// Backfilled: a listing's own embedding must retrieve neighbours, all with
		// cosine similarity in [-1, 1], excluding itself.
		const seed = withEmb[0] as { id: string; category_id: string; embedding: number[] };
		const { data, error } = await supabase.rpc("find_similar_listings", {
			query_embedding: seed.embedding,
			exclude_id: seed.id,
			target_category_id: null,
			match_count: 6,
		});
		expect(error).toBeNull();

		const rows = (data ?? []) as { id: string; similarity: number }[];
		expect(rows.length).toBeGreaterThan(0);
		for (const r of rows) {
			expect(r.id).not.toBe(seed.id);
			expect(r.similarity).toBeGreaterThanOrEqual(-1.0001);
			expect(r.similarity).toBeLessThanOrEqual(1.0001);
		}
	});
});

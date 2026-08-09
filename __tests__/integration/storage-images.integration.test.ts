// ============================================================================
// Integration — Storage image backfill plumbing
// ============================================================================
//
// Verifies the offline-images path WITHOUT depending on `npm run seed:images`
// having run:
//   * the public `listing-images` bucket exists (created by migration 0007);
//   * `set_listing_image_urls` round-trips (set a sentinel, read it back,
//     then restore the original) — non-destructive, so it is safe on the
//     seeded dataset in either CDN or Storage state.
// Requires local Supabase (service role).

import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { canRunSupabaseIntegrationTests } from "./env";

const run = canRunSupabaseIntegrationTests ? describe : describe.skip;

function admin(): SupabaseClient {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
}

run("storage image backfill", () => {
	const supabase = admin();

	it("the public listing-images bucket exists", async () => {
		const { data, error } = await supabase.storage.getBucket("listing-images");
		expect(error).toBeNull();
		expect(data?.name).toBe("listing-images");
		expect(data?.public).toBe(true);
	});

	it("set_listing_image_urls updates a row (and restores it)", async () => {
		// Grab one image row and remember its current values.
		const { data: rows, error: e1 } = await supabase
			.from("listing_images")
			.select("id, url, storage_path")
			.limit(1);
		expect(e1).toBeNull();
		expect(rows && rows.length).toBe(1);

		const original = rows![0] as { id: string; url: string; storage_path: string | null };

		try {
			// Write a sentinel via the RPC.
			const sentinelUrl = "http://127.0.0.1:55321/storage/v1/object/public/listing-images/pool/__test__.jpg";
			const { data: n, error: e2 } = await supabase.rpc("set_listing_image_urls", {
				items: [{ id: original.id, url: sentinelUrl, storage_path: "pool/__test__.jpg" }],
			});
			expect(e2).toBeNull();
			expect(Number(n)).toBe(1);

			const { data: after } = await supabase
				.from("listing_images")
				.select("url, storage_path")
				.eq("id", original.id)
				.single();
			expect(after?.url).toBe(sentinelUrl);
			expect(after?.storage_path).toBe("pool/__test__.jpg");
		} finally {
			// Restore the original values so the seed dataset is untouched.
			await supabase.rpc("set_listing_image_urls", {
				items: [{ id: original.id, url: original.url, storage_path: original.storage_path }],
			});
		}
	});
});

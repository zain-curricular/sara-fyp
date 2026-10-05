// ============================================================================
// Recommendations Feature — DAF: listRecommendationPool
// ============================================================================
//
// Single query: every active, automotive listing with the columns a listing
// card needs plus ONE cover image (embedded `listing_images`, ordered by
// position, limited to 1 per listing). The live service caches this pool in
// memory, so a decision normally makes no database round trip at all.
//
// Why one query, not "light pool + fetch winners"
// -----------------------------------------------
// The live database is far away (~400ms per round trip, whatever the size).
// The whole catalogue with one cover each is ~300KB, so fetching it once per
// cache window beats two round trips per click.

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListingRecord } from "@/lib/features/listings";

/** Card columns only — `description` and heavy JSON-free columns are left out. */
const POOL_COLUMNS =
	"id, user_id, platform, category_id, model_id, title, sale_type, price, is_negotiable, condition, " +
	"listing_condition, details, city, area, status, stock, created_at, updated_at, deleted_at, " +
	"listing_images(url, position)";

/** Fetches the recommendation pool (newest first). */
export async function listRecommendationPool(
	supabase: SupabaseClient,
	limit: number,
): Promise<{ data: ListingRecord[] | null; error: unknown }> {
	const { data, error } = await supabase
		.from("listings")
		.select(POOL_COLUMNS)
		.eq("status", "active")
		.is("deleted_at", null)
		.eq("platform", "automotive")
		.order("created_at", { ascending: false })
		.order("position", { referencedTable: "listing_images", ascending: true })
		.limit(1, { referencedTable: "listing_images" })
		.limit(limit);
	return { data: (data ?? null) as ListingRecord[] | null, error };
}

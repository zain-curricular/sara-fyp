// ============================================================================
// API: Similar Listings — GET
// ============================================================================
//
// GET /api/recommendations/similar?listingId=...
//
// Returns up to 6 listings similar to the given listing, using pgvector
// cosine similarity on the listings.embedding column. Falls back to
// same category + similar price range if no embedding exists.
// Public endpoint — no auth required.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
	const listingId = req.nextUrl.searchParams.get("listingId");

	if (!listingId) {
		return NextResponse.json(
			{ ok: false, error: "listingId is required" },
			{ status: 400 },
		);
	}

	const supabase = await createServerSupabaseClient();

	// Fetch the source listing
	const { data: listing, error: listingError } = await supabase
		.from("listings")
		.select("id, category_id, price, embedding")
		.eq("id", listingId)
		.maybeSingle();

	if (listingError || !listing) {
		return NextResponse.json(
			{ ok: false, error: "Listing not found" },
			{ status: 404 },
		);
	}

	const embedding = listing.embedding as number[] | null;
	const categoryId = listing.category_id as string;
	const price = listing.price as number;

	let similar: unknown[] = [];

	// Try vector similarity first
	if (embedding && Array.isArray(embedding) && embedding.length > 0) {
		const { data, error } = await supabase.rpc("find_similar_listings", {
			query_embedding: embedding,
			exclude_id: listingId,
			target_category_id: categoryId,
			match_count: 6,
		});

		if (!error && Array.isArray(data) && data.length > 0) {
			similar = data;
		}
	}

	// Fallback: same category + similar price range
	if (similar.length === 0) {
		const priceMin = price * 0.5;
		const priceMax = price * 2;

		const { data, error } = await supabase
			.from("listings")
			.select(
				"id, title, price, city, condition, category_id, listing_images(url, position)",
			)
			.eq("status", "active")
			.eq("category_id", categoryId)
			.neq("id", listingId)
			.gte("price", priceMin)
			.lte("price", priceMax)
			.order("created_at", { ascending: false })
			.limit(6);

		if (!error) similar = data ?? [];
	}

	return NextResponse.json({ ok: true, data: similar });
}

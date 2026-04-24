// ============================================================================
// API: For You Recommendations — GET
// ============================================================================
//
// GET /api/recommendations/for-you
//
// Auth required. Returns 8 personalized listing recommendations based on
// the user's recently viewed listings. Uses average embedding of recently
// viewed listings for vector search, falls back to same categories.

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const supabase = await createServerSupabaseClient();

	// Fetch recently viewed listing IDs for this user
	const { data: views } = await supabase
		.from("listing_views")
		.select("listing_id")
		.eq("user_id", auth.userId)
		.order("viewed_at", { ascending: false })
		.limit(10);

	const viewedIds = (views ?? []).map((v) => v.listing_id as string);

	if (viewedIds.length === 0) {
		// Cold start: return recent active listings
		const { data: recent } = await supabase
			.from("listings")
			.select("id, title, price, city, condition, category_id, listing_images(url, position)")
			.eq("status", "active")
			.order("created_at", { ascending: false })
			.limit(8);

		return NextResponse.json({ ok: true, data: recent ?? [] });
	}

	// Get categories from recently viewed
	const { data: viewedListings } = await supabase
		.from("listings")
		.select("id, category_id, embedding")
		.in("id", viewedIds);

	const categoryIds = [
		...new Set((viewedListings ?? []).map((l) => l.category_id as string)),
	];

	// Try vector search: use embedding of first viewed listing with an embedding
	const withEmbedding = (viewedListings ?? []).find(
		(l) => Array.isArray(l.embedding) && (l.embedding as number[]).length > 0,
	);

	let recommendations: unknown[] = [];

	if (withEmbedding?.embedding) {
		const { data, error } = await supabase.rpc("find_similar_listings_multi_category", {
			query_embedding: withEmbedding.embedding as number[],
			category_ids: categoryIds,
			exclude_ids: viewedIds,
			match_count: 8,
		});

		if (!error && Array.isArray(data) && data.length > 0) {
			recommendations = data;
		}
	}

	// Fallback: same categories, not already viewed
	if (recommendations.length === 0 && categoryIds.length > 0) {
		const { data } = await supabase
			.from("listings")
			.select("id, title, price, city, condition, category_id, listing_images(url, position)")
			.eq("status", "active")
			.in("category_id", categoryIds)
			.not("id", "in", `(${viewedIds.join(",")})`)
			.order("created_at", { ascending: false })
			.limit(8);

		recommendations = data ?? [];
	}

	return NextResponse.json({ ok: true, data: recommendations });
}

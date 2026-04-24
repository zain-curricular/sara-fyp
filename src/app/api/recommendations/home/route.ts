// ============================================================================
// API: Home Recommendations — GET
// ============================================================================
//
// GET /api/recommendations/home
//
// Returns 8 active listings ordered by creation date (newest first) for the
// homepage featured section. No authentication required — fully public.

import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// Route handler
// ----------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
	const supabase = await createServerSupabaseClient();

	const { data, error } = await supabase
		.from("listings")
		.select(
			`id, title, price, city, condition, created_at,
			 listing_images(url, position)`,
		)
		.eq("status", "active")
		.order("created_at", { ascending: false })
		.limit(8);

	if (error) {
		return NextResponse.json(
			{ ok: false, error: "Failed to load recommendations" },
			{ status: 500 },
		);
	}

	// Attach the primary image URL to each listing for convenience
	const listings = (data ?? []).map((listing) => {
		const images = (listing.listing_images as { url: string; position: number }[]) ?? [];
		const sorted = [...images].sort((a, b) => a.position - b.position);

		return {
			...listing,
			listing_images: undefined,
			imageUrl: sorted[0]?.url ?? null,
		};
	});

	return NextResponse.json({ ok: true, data: listings });
}

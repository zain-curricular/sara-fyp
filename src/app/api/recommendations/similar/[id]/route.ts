// ============================================================================
// API: Similar Listings — GET
// ============================================================================
//
// GET /api/recommendations/similar/[id]
//
// Returns up to 6 active listings that share the same category or model as
// the specified listing, excluding the listing itself. Used on listing detail
// pages to surface related parts. No authentication required.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// Route handler
// ----------------------------------------------------------------------------

export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const { id } = await params;

	if (!id) {
		return NextResponse.json({ ok: false, error: "Listing ID required" }, { status: 400 });
	}

	const supabase = await createServerSupabaseClient();

	// Fetch the target listing to get its category and model
	const { data: target, error: targetError } = await supabase
		.from("listings")
		.select("id, category_id, model_id")
		.eq("id", id)
		.maybeSingle();

	if (targetError || !target) {
		return NextResponse.json({ ok: false, error: "Listing not found" }, { status: 404 });
	}

	// Build the OR filter — match by category OR model (both optional)
	const filters: string[] = [];
	if (target.category_id) filters.push(`category_id.eq.${target.category_id}`);
	if (target.model_id) filters.push(`model_id.eq.${target.model_id}`);

	// If no filters can be built, return empty list
	if (filters.length === 0) {
		return NextResponse.json({ ok: true, data: [] });
	}

	const { data, error } = await supabase
		.from("listings")
		.select(
			`id, title, price, city, condition, created_at,
			 listing_images(url, position)`,
		)
		.eq("status", "active")
		.neq("id", id)
		.or(filters.join(","))
		.order("created_at", { ascending: false })
		.limit(6);

	if (error) {
		return NextResponse.json(
			{ ok: false, error: "Failed to load similar listings" },
			{ status: 500 },
		);
	}

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

// ============================================================================
// API: Frequently Bought Together — GET
// ============================================================================
//
// GET /api/recommendations/frequently-bought?listingId=...
//
// Finds other listings that appear in the same orders as the given listing.
// Returns top 5 co-purchased listings by co-occurrence count.
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

	// Find orders that contained this listing
	const { data: ordersWithItem, error: orderError } = await supabase
		.from("order_items")
		.select("order_id")
		.eq("listing_id", listingId)
		.limit(200);

	if (orderError || !ordersWithItem || ordersWithItem.length === 0) {
		return NextResponse.json({ ok: true, data: [] });
	}

	const orderIds = ordersWithItem.map((r) => r.order_id as string);

	// Find other listing_ids in those orders
	const { data: coItems, error: coError } = await supabase
		.from("order_items")
		.select("listing_id")
		.in("order_id", orderIds)
		.neq("listing_id", listingId);

	if (coError || !coItems || coItems.length === 0) {
		return NextResponse.json({ ok: true, data: [] });
	}

	// Count co-occurrences
	const counts = new Map<string, number>();
	for (const item of coItems) {
		const id = item.listing_id as string;
		counts.set(id, (counts.get(id) ?? 0) + 1);
	}

	// Sort by count, take top 5
	const topIds = [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([id]) => id);

	if (topIds.length === 0) {
		return NextResponse.json({ ok: true, data: [] });
	}

	// Fetch listing details
	const { data: listings, error: listingsError } = await supabase
		.from("listings")
		.select("id, title, price, city, condition, category_id, listing_images(url, position)")
		.in("id", topIds)
		.eq("status", "active");

	if (listingsError) {
		return NextResponse.json(
			{ ok: false, error: "Failed to fetch listings" },
			{ status: 500 },
		);
	}

	// Restore sort order from topIds
	const sorted = topIds
		.map((id) => (listings ?? []).find((l) => l.id === id))
		.filter(Boolean);

	return NextResponse.json({ ok: true, data: sorted });
}

// ============================================================================
// POST /api/listings/[id]/favorites — toggle favorite
// ============================================================================
//
// If the authenticated user has favourited this listing, deletes the row.
// Otherwise inserts a new favorites row. Returns { favorited: boolean }
// reflecting the post-toggle state.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id: listingId } = await params;

	const supabase = await createServerSupabaseClient();

	// Check for existing favorite
	const { data: existing, error: fetchError } = await supabase
		.from("favorites")
		.select("id")
		.eq("user_id", auth.userId)
		.eq("listing_id", listingId)
		.maybeSingle();

	if (fetchError) {
		console.error("[POST /api/listings/[id]/favorites] fetch:", fetchError);
		return NextResponse.json(
			{ ok: false, error: "Failed to toggle favorite" },
			{ status: 500 },
		);
	}

	if (existing) {
		// Unfavorite
		const { error: deleteError } = await supabase
			.from("favorites")
			.delete()
			.eq("user_id", auth.userId)
			.eq("listing_id", listingId);

		if (deleteError) {
			console.error("[POST /api/listings/[id]/favorites] delete:", deleteError);
			return NextResponse.json(
				{ ok: false, error: "Failed to toggle favorite" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ ok: true, data: { favorited: false } });
	}

	// Favorite
	const { error: insertError } = await supabase
		.from("favorites")
		.insert({ user_id: auth.userId, listing_id: listingId });

	if (insertError) {
		console.error("[POST /api/listings/[id]/favorites] insert:", insertError);
		return NextResponse.json(
			{ ok: false, error: "Failed to toggle favorite" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data: { favorited: true } });
}

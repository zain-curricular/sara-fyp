// ============================================================================
// GET /api/listings/[id]/is-favorited — is this listing favorited by the caller
// ============================================================================
//
// Auth required. Returns { is_favorited: boolean } for the authenticated user.
// Drives the favorite button's initial filled/empty state on the listing detail.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id: listingId } = await params;

	const supabase = await createServerSupabaseClient();
	const { data, error } = await supabase
		.from("favorites")
		.select("id")
		.eq("user_id", auth.userId)
		.eq("listing_id", listingId)
		.maybeSingle();

	if (error) {
		console.error("[GET /api/listings/[id]/is-favorited]", error);
		return NextResponse.json({ ok: false, error: "Failed to check favorite" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data: { is_favorited: Boolean(data) } });
}

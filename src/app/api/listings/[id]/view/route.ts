// ============================================================================
// POST /api/listings/[id]/view — record a listing view
// ============================================================================
//
// Auth required. Upserts a `listing_views` row for the caller (one per listing,
// bumping viewed_at on repeat views). Feeds "Recently viewed" and the "For You"
// recommendations. Best-effort on the client — errors are swallowed there.

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
	const { error } = await supabase
		.from("listing_views")
		.upsert(
			{ user_id: auth.userId, listing_id: listingId, viewed_at: new Date().toISOString() },
			{ onConflict: "user_id,listing_id" },
		);

	if (error) {
		console.error("[POST /api/listings/[id]/view]", error);
		return NextResponse.json({ ok: false, error: "Failed to record view" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}

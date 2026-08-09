// ============================================================================
// GET /api/profiles/[id]/reviews
// ============================================================================
//
// Public, paginated reviews written ABOUT a profile (its `reviewed_user_id`).
// No auth required. Consumed by:
//   * the listing detail RSC (seller reviews block) via fetchProfileReviewsPage
//   * the seller public page (/sellers/[id])
//   * the reviews "load more" hook (client-side pagination)
//
// Query params: `page` (1-based, default 1), `limit` (default 20, max 50).
//
// Response shape (matches ProfileReviewsResponse → ReviewsListPayload):
//   { ok: true, data: ReviewRecord[], pagination: { total, limit, offset, hasMore } }
//   { ok: false, error: string }

import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	const { id } = await params;

	if (!id) {
		return NextResponse.json({ ok: false, error: "Missing profile id" }, { status: 400 });
	}

	// Parse + clamp pagination.
	const sp = request.nextUrl.searchParams;
	const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
	const limit = Math.min(
		MAX_LIMIT,
		Math.max(1, Number.parseInt(sp.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
	);
	const offset = (page - 1) * limit;

	const supabase = await createServerSupabaseClient();
	const { data, count, error } = await supabase
		.from("reviews")
		.select(
			"id, reviewer_id, reviewed_user_id, order_id, listing_id, rating, comment, created_at",
			{ count: "exact" },
		)
		.eq("reviewed_user_id", id)
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (error) {
		console.error("[GET /api/profiles/[id]/reviews]", error);
		return NextResponse.json({ ok: false, error: "Failed to load reviews" }, { status: 500 });
	}

	const total = count ?? 0;

	return NextResponse.json({
		ok: true,
		data: data ?? [],
		pagination: {
			total,
			limit,
			offset,
			hasMore: offset + (data?.length ?? 0) < total,
		},
	});
}

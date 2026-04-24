// ============================================================================
// POST /api/reviews/[id]/reply
// ============================================================================
//
// Allows a seller to post a reply to a review of their store/listing.
// Updates reviews.seller_reply and seller_replied_at.
//
// Auth: must be authenticated. The seller must own the listing the review is for.

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const bodySchema = z.object({
	reply: z.string().min(1, "Reply cannot be empty").max(1000, "Reply must be under 1000 characters"),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id: reviewId } = await params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const supabase = await createServerSupabaseClient();

	// Fetch review to verify the reviewer_id / reviewed_user_id
	const { data: review, error: fetchError } = await supabase
		.from("reviews")
		.select("id, reviewed_user_id, listing_id")
		.eq("id", reviewId)
		.maybeSingle();

	if (fetchError) {
		console.error("[POST /api/reviews/:id/reply] fetch:", fetchError);
		return NextResponse.json({ ok: false, error: "Failed to load review" }, { status: 500 });
	}

	if (!review) {
		return NextResponse.json({ ok: false, error: "Review not found" }, { status: 404 });
	}

	const r = review as Record<string, unknown>;

	// Only the seller (reviewed user) may reply
	if (r.reviewed_user_id !== auth.userId) {
		return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
	}

	const { error: updateError } = await supabase
		.from("reviews")
		.update({
			seller_reply: parsed.data.reply,
			seller_replied_at: new Date().toISOString(),
		})
		.eq("id", reviewId);

	if (updateError) {
		console.error("[POST /api/reviews/:id/reply] update:", updateError);
		return NextResponse.json({ ok: false, error: "Failed to save reply" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data: null });
}

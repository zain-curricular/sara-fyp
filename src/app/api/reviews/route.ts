// ============================================================================
// Reviews API — GET /api/reviews · POST /api/reviews
// ============================================================================
//
// GET:  Query params `listing_id` OR `seller_id` — exactly one is required.
//       Returns paginated reviews with reviewer profile embedded.
//
// POST: Buyer who completed an order may review the listing they purchased.
//       Body: { listing_id, order_id, rating, comment }. Verifies the order
//       exists, belongs to the buyer, references the listing, and is in a
//       completed state before inserting the review row.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// GET — list reviews
// ----------------------------------------------------------------------------

const listQuerySchema = z
	.object({
		listing_id: z.string().uuid().optional(),
		seller_id: z.string().uuid().optional(),
		page: z.coerce.number().int().min(1).max(10_000).default(1),
		limit: z.coerce.number().int().min(1).max(50).default(20),
	})
	.refine((v) => Boolean(v.listing_id) !== Boolean(v.seller_id), {
		message: "Provide exactly one of listing_id or seller_id",
	});

export async function GET(req: NextRequest) {
	const { searchParams } = req.nextUrl;
	const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));

	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid query parameters" },
			{ status: 400 },
		);
	}

	const { listing_id, seller_id, page, limit } = parsed.data;
	const offset = (page - 1) * limit;
	const to = offset + limit - 1;

	const supabase = await createServerSupabaseClient();

	let query = supabase
		.from("reviews")
		.select("*, reviewer:profiles!reviewer_id(full_name, avatar_url)", { count: "exact" })
		.order("created_at", { ascending: false });

	if (listing_id) {
		query = query.eq("listing_id", listing_id);
	} else if (seller_id) {
		query = query.eq("reviewed_user_id", seller_id);
	}

	const { data, error, count } = await query.range(offset, to);

	if (error) {
		console.error("[GET /api/reviews]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load reviews" },
			{ status: 500 },
		);
	}

	const total = count ?? 0;
	return NextResponse.json({
		ok: true,
		data,
		pagination: { total, page, limit, hasMore: total > offset + limit },
	});
}

// ----------------------------------------------------------------------------
// POST — create review
// ----------------------------------------------------------------------------

const postSchema = z
	.object({
		listing_id: z.string().uuid(),
		order_id: z.string().uuid(),
		rating: z.number().int().min(1).max(5),
		comment: z.string().max(1000).optional().nullable(),
	})
	.strict();

export async function POST(req: NextRequest) {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const body = await req.json().catch(() => null);
	if (!body) {
		return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = postSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { listing_id, order_id, rating, comment } = parsed.data;
	const supabase = await createServerSupabaseClient();

	// Verify order belongs to this buyer, references the listing, is completed
	const { data: order, error: orderErr } = await supabase
		.from("orders")
		.select("id, buyer_id, seller_id, listing_id, ss_status")
		.eq("id", order_id)
		.eq("buyer_id", auth.userId)
		.maybeSingle();

	if (orderErr) {
		console.error("[POST /api/reviews] order fetch:", orderErr);
		return NextResponse.json(
			{ ok: false, error: "Failed to create review" },
			{ status: 500 },
		);
	}

	if (!order) {
		return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
	}

	const orderRow = order as {
		id: string;
		buyer_id: string;
		seller_id: string;
		listing_id: string;
		ss_status: string;
	};

	if (orderRow.listing_id !== listing_id) {
		return NextResponse.json(
			{ ok: false, error: "Order does not match listing" },
			{ status: 400 },
		);
	}

	if (orderRow.ss_status !== "completed") {
		return NextResponse.json(
			{ ok: false, error: "Order must be completed before leaving a review" },
			{ status: 409 },
		);
	}

	// Check for duplicate review
	const { count } = await supabase
		.from("reviews")
		.select("id", { count: "exact", head: true })
		.eq("order_id", order_id)
		.eq("reviewer_id", auth.userId);

	if ((count ?? 0) > 0) {
		return NextResponse.json(
			{ ok: false, error: "You have already reviewed this order" },
			{ status: 409 },
		);
	}

	const { data, error } = await supabase
		.from("reviews")
		.insert({
			order_id,
			listing_id,
			reviewer_id: auth.userId,
			reviewed_user_id: orderRow.seller_id,
			rating,
			comment: comment ?? null,
		})
		.select()
		.single();

	if (error) {
		console.error("[POST /api/reviews] insert:", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to create review" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}

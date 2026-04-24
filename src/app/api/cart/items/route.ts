// ============================================================================
// POST /api/cart/items
// ============================================================================
//
// Add a listing to the authenticated user's cart. Upserts on
// (cart_id, listing_id) — calling again with the same listing replaces qty.
// Validates listing is active and stock is sufficient.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { addToCartSchema } from "@/lib/features/cart/schemas";
import { addToCart } from "@/lib/features/cart/services";

export async function POST(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = addToCartSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { listingId, qty } = parsed.data;
	const { data, error } = await addToCart(auth.userId, listingId, qty);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to add to cart";
		const isValidation =
			msg === "Listing not found" ||
			msg === "Listing is not active" ||
			msg === "Insufficient stock";

		return NextResponse.json({ ok: false, error: msg }, { status: isValidation ? 400 : 500 });
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}

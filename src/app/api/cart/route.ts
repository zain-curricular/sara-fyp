// ============================================================================
// GET /api/cart
// ============================================================================
//
// Returns the authenticated user's cart with items joined to listing + store
// data, grouped by seller. Used by useCart() hook and the cart page RSC.

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getCartWithItems } from "@/lib/features/cart/services";

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { data, error } = await getCartWithItems(auth.userId);

	if (error) {
		console.error("[GET /api/cart]", error);
		return NextResponse.json({ ok: false, error: "Failed to load cart" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}

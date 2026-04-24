// ============================================================================
// PATCH /api/cart/items/[id] — update qty
// DELETE /api/cart/items/[id] — remove item
// ============================================================================
//
// Both operations validate that the cart item belongs to the authenticated
// user before mutating. [id] is the cart_items.id UUID.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { updateCartItemSchema } from "@/lib/features/cart/schemas";
import { updateCartItem, removeCartItem } from "@/lib/features/cart/services";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await context.params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = updateCartItemSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { error } = await updateCartItem(auth.userId, id, parsed.data.qty);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to update item";
		const status = msg === "Forbidden" ? 403 : msg === "Cart item not found" ? 404 : 500;
		return NextResponse.json({ ok: false, error: msg }, { status });
	}

	return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await context.params;

	const { error } = await removeCartItem(auth.userId, id);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to remove item";
		const status = msg === "Forbidden" ? 403 : msg === "Cart item not found" ? 404 : 500;
		return NextResponse.json({ ok: false, error: msg }, { status });
	}

	return NextResponse.json({ ok: true });
}

// ============================================================================
// POST /api/orders/[id]/accept — seller accepts order
// ============================================================================
//
// Transitions order from paid_escrow → accepted.
// Only the seller of the order may call this endpoint.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getOrderDetail, transitionOrderStatus } from "@/lib/features/orders/services";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await context.params;

	// Verify caller is the seller
	const { data: order, error: fetchError } = await getOrderDetail(id, auth.userId);
	if (fetchError) {
		const msg = fetchError instanceof Error ? fetchError.message : "Error";
		if (msg === "Forbidden") {
			return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
		}
		return NextResponse.json({ ok: false, error: "Failed to load order" }, { status: 500 });
	}
	if (!order) {
		return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
	}
	if (order.sellerId !== auth.userId) {
		return NextResponse.json({ ok: false, error: "Only the seller can accept this order" }, { status: 403 });
	}

	const { error } = await transitionOrderStatus(id, auth.userId, "accepted");

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to accept order";
		return NextResponse.json({ ok: false, error: msg }, { status: 400 });
	}

	return NextResponse.json({ ok: true });
}

// ============================================================================
// POST /api/orders/[id]/deliver — seller marks order delivered
// ============================================================================
//
// Adds the missing FSM edge shipped -> delivered. Seller-owned; goes through
// transitionOrderStatus (the guarded state machine, not around it), which sets
// delivered_at, records a status event, and notifies the buyer. Once delivered,
// the buyer's "Confirm receipt" action (which releases escrow) becomes reachable
// and the 7-day auto-release cron can pick the order up.

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

	// Verify caller is the seller on this order.
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
		return NextResponse.json({ ok: false, error: "Only the seller can mark this delivered" }, { status: 403 });
	}

	// shipped -> delivered (guarded by the state machine).
	const { error } = await transitionOrderStatus(id, auth.userId, "delivered", "Marked delivered by seller");

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to mark delivered";
		// A wrong-state transition ("Cannot transition from …") is a conflict.
		const status = msg.startsWith("Cannot transition") ? 409 : 400;
		return NextResponse.json({ ok: false, error: msg }, { status });
	}

	return NextResponse.json({ ok: true });
}

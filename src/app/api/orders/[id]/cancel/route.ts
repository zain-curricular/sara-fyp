// ============================================================================
// POST /api/orders/[id]/cancel — buyer or admin cancels order
// ============================================================================
//
// Transitions order to cancelled. Buyers may cancel pre-acceptance.
// Admins can cancel any order. Refunds escrow if held/released.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getOrderDetail, transitionOrderStatus } from "@/lib/features/orders/services";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await context.params;

	let note: string | undefined;
	try {
		const body = await request.json() as Record<string, unknown>;
		note = typeof body.note === "string" ? body.note : undefined;
	} catch {
		// Body is optional for cancel
	}

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

	// Non-admins: only buyer can cancel, and only before acceptance
	const isAdmin = auth.roles.includes("admin");
	if (!isAdmin) {
		if (order.buyerId !== auth.userId) {
			return NextResponse.json({ ok: false, error: "Only the buyer can cancel this order" }, { status: 403 });
		}
		const preCancellable = ["pending_payment", "paid_escrow"];
		if (!preCancellable.includes(order.ssStatus)) {
			return NextResponse.json(
				{ ok: false, error: "Order can only be cancelled before it is accepted" },
				{ status: 400 },
			);
		}
	}

	const { error } = await transitionOrderStatus(id, auth.userId, "cancelled", note);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to cancel order";
		return NextResponse.json({ ok: false, error: msg }, { status: 400 });
	}

	// If there was escrow, mark as refunded
	const admin = createAdminSupabaseClient();
	await admin
		.from("escrow_transactions")
		.update({ status: "refunded" })
		.eq("order_id", id)
		.in("status", ["held", "released"]);

	return NextResponse.json({ ok: true });
}

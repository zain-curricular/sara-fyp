// ============================================================================
// POST /api/orders/[id]/ship — seller marks order shipped
// ============================================================================
//
// Transitions order from accepted → shipped and stores tracking info.
// Only the seller may call this. Requires trackingNumber and courierName.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { shipOrderSchema } from "@/lib/features/orders/schemas";
import { getOrderDetail, transitionOrderStatus } from "@/lib/features/orders/services";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await context.params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = shipOrderSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

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
		return NextResponse.json({ ok: false, error: "Only the seller can mark this as shipped" }, { status: 403 });
	}

	// Store tracking info
	const admin = createAdminSupabaseClient();
	await admin
		.from("orders")
		.update({
			tracking_number: parsed.data.trackingNumber,
			courier_name: parsed.data.courierName,
		})
		.eq("id", id);

	// Transition status
	const { error } = await transitionOrderStatus(
		id,
		auth.userId,
		"shipped",
		`Shipped via ${parsed.data.courierName} — tracking: ${parsed.data.trackingNumber}`,
	);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to ship order";
		return NextResponse.json({ ok: false, error: msg }, { status: 400 });
	}

	return NextResponse.json({ ok: true });
}

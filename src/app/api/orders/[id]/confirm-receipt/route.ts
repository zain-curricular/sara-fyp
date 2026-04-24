// ============================================================================
// POST /api/orders/[id]/confirm-receipt — buyer confirms delivery
// ============================================================================
//
// Transitions order from delivered → completed and releases escrow.
// Only the buyer may call this.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { confirmReceipt } from "@/lib/features/orders/services";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await context.params;

	const { error } = await confirmReceipt(auth.userId, id);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to confirm receipt";
		const status =
			msg === "Forbidden" ? 403 :
			msg === "Order not found" ? 404 :
			400;

		return NextResponse.json({ ok: false, error: msg }, { status });
	}

	return NextResponse.json({ ok: true });
}

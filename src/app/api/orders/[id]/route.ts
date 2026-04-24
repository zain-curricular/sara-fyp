// ============================================================================
// GET /api/orders/[id] — order detail
// ============================================================================
//
// Returns the full order detail for the authenticated viewer (buyer or seller).
// Used by the review flow, order detail pages, and tracking.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { getOrderDetail } from "@/lib/features/orders/services";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { id } = await context.params;

	const { data, error } = await getOrderDetail(id, auth.userId);

	if (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		if (msg === "Forbidden") {
			return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
		}
		console.error("[GET /api/orders/[id]]", error);
		return NextResponse.json({ ok: false, error: "Failed to load order" }, { status: 500 });
	}

	if (!data) {
		return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
	}

	return NextResponse.json({ ok: true, data });
}

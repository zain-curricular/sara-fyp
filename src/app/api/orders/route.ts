// ============================================================================
// GET /api/orders — list orders
// POST /api/orders — place order
// ============================================================================
//
// GET: Returns orders filtered by ?role=buyer|seller and optional ?status=
// POST: Places a new order from a seller group in the buyer's cart.

import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/auth/guards";
import { placeOrderSchema } from "@/lib/features/orders/schemas";
import {
	getOrdersForBuyer,
	getOrdersForSeller,
	placeOrder,
} from "@/lib/features/orders/services";
import type { OrderStatus } from "@/lib/features/orders/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { searchParams } = request.nextUrl;
	const role = searchParams.get("role") ?? "buyer";
	const status = searchParams.get("status") as OrderStatus | null;

	if (role === "seller") {
		const { data, error } = await getOrdersForSeller(
			auth.userId,
			status ?? undefined,
		);

		if (error) {
			console.error("[GET /api/orders seller]", error);
			return NextResponse.json({ ok: false, error: "Failed to load orders" }, { status: 500 });
		}

		return NextResponse.json({ ok: true, data });
	}

	// Default: buyer
	const { data, error } = await getOrdersForBuyer(auth.userId, status ?? undefined);

	if (error) {
		console.error("[GET /api/orders buyer]", error);
		return NextResponse.json({ ok: false, error: "Failed to load orders" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = placeOrderSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { data, error } = await placeOrder(auth.userId, parsed.data);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to place order";
		const isUserError =
			msg === "Shipping address is required" ||
			msg.includes("is no longer available") ||
			msg === "Cart not found" ||
			msg === "No cart items found for this seller";

		return NextResponse.json({ ok: false, error: msg }, { status: isUserError ? 400 : 500 });
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}

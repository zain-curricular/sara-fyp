// ============================================================================
// GET|POST /api/disputes
// ============================================================================
//
// GET  ?role=buyer|seller — list disputes for the authenticated user.
// POST — open a new dispute (buyers only).
//
// POST body: { orderId, reason, description, evidenceUrls: string[] }

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import {
	listDisputesForBuyer,
	listDisputesForSeller,
	openDispute,
} from "@/lib/features/disputes/services";
import type { DisputeReason } from "@/lib/features/disputes/types";

const DISPUTE_REASONS: DisputeReason[] = [
	"item_not_received",
	"item_not_as_described",
	"damaged_item",
	"wrong_item",
	"seller_unresponsive",
	"other",
];

const postBody = z.object({
	orderId: z.string().uuid("Invalid order ID"),
	reason: z.enum(DISPUTE_REASONS as [DisputeReason, ...DisputeReason[]]),
	description: z
		.string()
		.min(10, "Describe the issue in at least 10 characters")
		.max(2000, "Keep it under 2000 characters"),
	evidenceUrls: z.array(z.string().url("Invalid URL")).max(10).optional().default([]),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const role = request.nextUrl.searchParams.get("role") ?? "buyer";

	if (role === "seller") {
		const { data, error } = await listDisputesForSeller(auth.userId);
		if (error) {
			console.error("[GET /api/disputes seller]", error);
			return NextResponse.json({ ok: false, error: "Failed to load disputes" }, { status: 500 });
		}
		return NextResponse.json({ ok: true, data });
	}

	const { data, error } = await listDisputesForBuyer(auth.userId);
	if (error) {
		console.error("[GET /api/disputes buyer]", error);
		return NextResponse.json({ ok: false, error: "Failed to load disputes" }, { status: 500 });
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

	const parsed = postBody.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { orderId, reason, description, evidenceUrls } = parsed.data;

	const { data, error } = await openDispute(
		auth.userId,
		orderId,
		reason,
		description,
		evidenceUrls,
	);

	if (error) {
		const msg = error instanceof Error ? error.message : "Failed to open dispute";
		const isUserError =
			msg === "Order not found" ||
			msg === "Forbidden" ||
			msg.startsWith("Cannot open dispute");

		return NextResponse.json({ ok: false, error: msg }, { status: isUserError ? 400 : 500 });
	}

	return NextResponse.json({ ok: true, data }, { status: 201 });
}

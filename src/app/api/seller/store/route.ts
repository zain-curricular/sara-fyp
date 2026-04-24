// ============================================================================
// GET|PATCH /api/seller/store
// ============================================================================
//
// GET  — returns the authenticated seller's own store record.
// PATCH — updates allowed store fields (storeName, city, description, logoUrl, bannerUrl).
//
// Both endpoints require authentication. Seller role is enforced implicitly
// (only a user who has a store can GET; PATCH is idempotent if no store exists).

import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/auth/guards";
import { getStoreByOwner, updateStore } from "@/lib/features/seller-store/services";

// ----------------------------------------------------------------------------
// PATCH schema
// ----------------------------------------------------------------------------

const patchBody = z.object({
	storeName: z.string().min(3, "Store name must be at least 3 characters").optional(),
	city: z.string().min(2, "Enter a city").optional(),
	description: z.string().max(500, "Keep it under 500 characters").optional(),
	logoUrl: z.string().url("Invalid logo URL").nullable().optional(),
	bannerUrl: z.string().url("Invalid banner URL").nullable().optional(),
});

// ----------------------------------------------------------------------------
// Handlers
// ----------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	const { data, error } = await getStoreByOwner(auth.userId);

	if (error) {
		console.error("[GET /api/seller/store]", error);
		return NextResponse.json({ ok: false, error: "Failed to load store" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
	const auth = await authenticateRequest();
	if (!auth.ok) return auth.error;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
	}

	const parsed = patchBody.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
			{ status: 422 },
		);
	}

	const { error } = await updateStore(auth.userId, parsed.data);

	if (error) {
		console.error("[PATCH /api/seller/store]", error);
		return NextResponse.json({ ok: false, error: "Failed to update store" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, data: null });
}

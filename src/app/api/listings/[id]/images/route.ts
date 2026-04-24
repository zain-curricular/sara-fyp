// ============================================================================
// GET /api/listings/[id]/images — list images for a listing
// ============================================================================
//
// Returns ordered image records (by position) for the listing.
// Public — no auth required. Delegates to listListingImages().

import { NextRequest, NextResponse } from "next/server";

import { listListingImages } from "@/lib/features/listings/services";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
	const { id } = await params;

	const { data, error } = await listListingImages(id);

	if (error) {
		console.error("[GET /api/listings/[id]/images]", error);
		return NextResponse.json(
			{ ok: false, error: "Failed to load images" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, data });
}
